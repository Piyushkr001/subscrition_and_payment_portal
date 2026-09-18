import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncSubscriptionFromStripe } from "@/lib/stripe/sync-subscription"
import type { SubscriptionPlan } from "@/types/database"

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

  // 1. Check idempotency: Return 200 immediately if this event ID was already successfully processed
  try {
    const { data: existingEvent, error: checkEventError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("status")
      .eq("stripe_event_id", event.id)
      .maybeSingle()

    if (checkEventError) {
      console.error("[Stripe Webhook]: Error checking event idempotency:", checkEventError)
      // Throw to return 500 so Stripe retries
      throw checkEventError
    }

    if (existingEvent?.status === "processed") {
      console.log(`[Stripe Webhook]: Duplicate event ${event.id} already processed. Acknowledging with 200.`)
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    // Record or update event status as 'processing'
    const { error: upsertEventError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .upsert(
        {
          stripe_event_id: event.id,
          event_type: event.type,
          status: "processing",
          created_at: new Date().toISOString(),
        },
        { onConflict: "stripe_event_id" }
      )

    if (upsertEventError) {
      console.error("[Stripe Webhook]: Error recording event processing status:", upsertEventError)
      throw upsertEventError
    }
  } catch (idempotencyErr) {
    console.error("[Stripe Webhook Idempotency Error]:", idempotencyErr)
    return NextResponse.json(
      { error: "Database error verifying webhook idempotency." },
      { status: 500 }
    )
  }

  // 2. Process event with centralized subscription synchronizer
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          const userId =
            session.metadata?.userId ||
            session.client_reference_id ||
            subscription.metadata?.userId

          await syncSubscriptionFromStripe(subscription, {
            eventTimestamp: event.created,
            userId,
            fallbackPlan: session.metadata?.plan as SubscriptionPlan,
          })

          console.log(`[Stripe Webhook]: Synced checkout session for user ${userId || "unknown"}`)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await syncSubscriptionFromStripe(subscription, {
          eventTimestamp: event.created,
        })
        console.log(`[Stripe Webhook]: Synced subscription lifecycle (${event.type}) for ${subscription.id}`)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { error: deleteError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: false,
            last_stripe_event_timestamp: event.created,
            updated_at: new Date().toISOString(),
          })
          .eq("provider_subscription_id", subscriptionId)

        if (deleteError) {
          console.error(`[Stripe Webhook Error]: Failed to cancel subscription ${subscriptionId}:`, deleteError)
          throw deleteError
        }

        console.log(`[Stripe Webhook]: Marked subscription ${subscriptionId} as cancelled`)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = extractInvoiceSubscriptionId(invoice)

        if (subscriptionId) {
          // Do not blindly set active; fetch actual Stripe subscription state and sync
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncSubscriptionFromStripe(subscription, {
            eventTimestamp: event.created,
          })
          console.log(`[Stripe Webhook]: Handled invoice.payment_succeeded for sub ${subscriptionId}`)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = extractInvoiceSubscriptionId(invoice)

        if (subscriptionId) {
          // Retrieve actual subscription state and sync (e.g. past_due or unpaid)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncSubscriptionFromStripe(subscription, {
            eventTimestamp: event.created,
          })
          console.log(`[Stripe Webhook]: Handled invoice.payment_failed for sub ${subscriptionId}`)
        }
        break
      }

      default:
        // Other events safely acknowledged
        break
    }

    // 3. Mark webhook event as 'processed'
    const { error: markProcessedError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("stripe_event_id", event.id)

    if (markProcessedError) {
      console.warn("[Stripe Webhook]: Could not mark event as processed:", markProcessedError)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error processing webhook event."
    console.error("[Stripe Webhook Handler Error]:", errorMessage, error)

    // Mark event as 'failed' in audit table so it can be retried safely
    try {
      await supabaseAdmin
        .from("stripe_webhook_events")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("stripe_event_id", event.id)
    } catch (auditErr: unknown) {
      console.error("[Stripe Webhook]: Failed to update audit log to failed:", auditErr)
    }

    // Return 500 so Stripe knows to retry
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
