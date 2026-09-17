import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database"

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status | string): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
      return "cancelled"
    case "unpaid":
      return "unpaid"
    case "incomplete_expired":
      return "expired"
    case "incomplete":
      return "incomplete"
    case "paused":
      return "paused"
    default:
      return "active"
  }
}

function resolvePlan(interval?: string | null): SubscriptionPlan {
  return interval === "year" ? "yearly" : "monthly"
}

function extractSubscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSub = subscription as any

  const startTimestamp = item?.current_period_start || rawSub.current_period_start
  const endTimestamp = item?.current_period_end || rawSub.current_period_end

  const periodStart = startTimestamp
    ? new Date(startTimestamp * 1000).toISOString()
    : null
  const periodEnd = endTimestamp
    ? new Date(endTimestamp * 1000).toISOString()
    : null

  return { periodStart, periodEnd }
}

function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawInvoice = invoice as any

  if (typeof rawInvoice.subscription === "string") {
    return rawInvoice.subscription
  }
  if (rawInvoice.subscription?.id) {
    return rawInvoice.subscription.id
  }
  if (typeof rawInvoice.parent?.subscription_details?.subscription === "string") {
    return rawInvoice.parent.subscription_details.subscription
  }
  if (rawInvoice.lines?.data?.[0]?.subscription) {
    const lineSub = rawInvoice.lines.data[0].subscription
    return typeof lineSub === "string" ? lineSub : lineSub.id || null
  }
  return null
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[Stripe Webhook Error]: STRIPE_WEBHOOK_SECRET is not configured.")
    return NextResponse.json(
      { error: "Webhook secret configuration is missing." },
      { status: 500 }
    )
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    )
  }

  const rawBody = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature."
    console.error("[Stripe Webhook Signature Verification Failed]:", message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          const customerId = typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || (typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id)

          const userId =
            session.metadata?.userId ||
            session.client_reference_id ||
            subscription.metadata?.userId

          if (!userId) {
            console.warn(`[Stripe Webhook]: No userId found for session ${session.id}`)
            break
          }

          const priceId = subscription.items?.data?.[0]?.price?.id || null
          const interval = subscription.items?.data?.[0]?.price?.recurring?.interval
          const plan = (session.metadata?.plan as SubscriptionPlan) || resolvePlan(interval)
          const status = normalizeSubscriptionStatus(subscription.status)
          const { periodStart, periodEnd } = extractSubscriptionPeriod(subscription)

          // Check if subscription record already exists
          const { data: existingSub } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("provider_subscription_id", subscriptionId)
            .maybeSingle()

          if (existingSub) {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                provider_customer_id: customerId,
                stripe_price_id: priceId,
                plan,
                status,
                current_period_start: periodStart,
                current_period_end: periodEnd,
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingSub.id)
          } else {
            // Check if placeholder row exists for user
            const { data: userSub } = await supabaseAdmin
              .from("subscriptions")
              .select("id")
              .eq("user_id", userId)
              .is("provider_subscription_id", null)
              .maybeSingle()

            if (userSub) {
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  provider_customer_id: customerId,
                  provider_subscription_id: subscriptionId,
                  stripe_price_id: priceId,
                  plan,
                  status,
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  cancel_at_period_end: subscription.cancel_at_period_end,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userSub.id)
            } else {
              await supabaseAdmin
                .from("subscriptions")
                .insert({
                  user_id: userId,
                  provider_customer_id: customerId,
                  provider_subscription_id: subscriptionId,
                  stripe_price_id: priceId,
                  plan,
                  status,
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  cancel_at_period_end: subscription.cancel_at_period_end,
                })
            }
          }

          console.log(`[Stripe Webhook]: Synced subscription for user ${userId} (status: ${status})`)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id

        const priceId = subscription.items?.data?.[0]?.price?.id || null
        const interval = subscription.items?.data?.[0]?.price?.recurring?.interval
        const plan = (subscription.metadata?.plan as SubscriptionPlan) || resolvePlan(interval)
        const status = normalizeSubscriptionStatus(subscription.status)
        const { periodStart, periodEnd } = extractSubscriptionPeriod(subscription)

        // 1. Try matching by provider_subscription_id
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id")
          .eq("provider_subscription_id", subscriptionId)
          .maybeSingle()

        if (existingSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              provider_customer_id: customerId,
              stripe_price_id: priceId,
              plan,
              status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSub.id)
        } else {
          // 2. Try matching by metadata userId or customerId
          let resolvedUserId: string | null = subscription.metadata?.userId || null
          if (!resolvedUserId && customerId) {
            const { data: subByCustomer } = await supabaseAdmin
              .from("subscriptions")
              .select("user_id")
              .eq("provider_customer_id", customerId)
              .maybeSingle()
            resolvedUserId = subByCustomer?.user_id || null
          }

          if (resolvedUserId) {
            await supabaseAdmin.from("subscriptions").insert({
              user_id: resolvedUserId,
              provider_customer_id: customerId,
              provider_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              plan,
              status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
          }
        }
        console.log(`[Stripe Webhook]: Updated subscription ${subscriptionId} (status: ${status})`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscriptionId)

        console.log(`[Stripe Webhook]: Cancelled subscription ${subscriptionId}`)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = extractInvoiceSubscriptionId(invoice)

        if (subscriptionId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("provider_subscription_id", subscriptionId)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = extractInvoiceSubscriptionId(invoice)

        if (subscriptionId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("provider_subscription_id", subscriptionId)
          console.log(`[Stripe Webhook]: Payment failed for subscription ${subscriptionId}`)
        }
        break
      }

      default:
        // Acknowledge unhandled events
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("[Stripe Webhook Handler Error]:", error)
    return NextResponse.json(
      { error: "Error processing webhook event." },
      { status: 500 }
    )
  }
}
