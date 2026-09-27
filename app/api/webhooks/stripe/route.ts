import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { syncSubscriptionFromStripe } from "@/lib/stripe/sync-subscription"
import { recordCharityAllocationFromInvoice } from "@/lib/charity/record-contribution"
import type { SubscriptionPlan } from "@/types/database"

function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const rawInvoice = invoice as unknown as Record<string, unknown>
  const sub = rawInvoice.subscription
  if (typeof sub === "string") {
    return sub
  }
  if (sub && typeof sub === "object" && "id" in sub) {
    return (sub as { id: string }).id
  }

  const parent = rawInvoice.parent as Record<string, unknown> | undefined
  const subDetails = parent?.subscription_details as Record<string, unknown> | undefined
  if (typeof subDetails?.subscription === "string") {
    return subDetails.subscription
  }

  const lines = invoice.lines?.data
  if (lines && lines.length > 0) {
    const rawLine = lines[0] as unknown as Record<string, unknown>
    const lineSub = rawLine.subscription
    if (typeof lineSub === "string") {
      return lineSub
    }
    if (lineSub && typeof lineSub === "object" && "id" in lineSub) {
      return (lineSub as { id: string }).id
    }
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

  // 1. Atomic event claiming via PostgreSQL RPC (Concurrency-safe and idempotent)
  try {
    const { data: claimRows, error: claimRpcError } = await supabaseAdmin.rpc(
      "claim_stripe_webhook_event",
      {
        p_event_id: event.id,
        p_event_type: event.type,
      }
    )

    if (claimRpcError) {
      console.error("[Stripe Webhook]: Error claiming event via RPC:", claimRpcError)
      throw claimRpcError
    }

    const claim = claimRows?.[0]

    // Acknowledge duplicates immediately
    if (claim?.already_processed) {
      console.log(`[Stripe Webhook]: Duplicate event ${event.id} already processed. Acknowledging with 200.`)
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    // If another concurrent execution is actively working on it, acknowledge so it does not collide
    if (!claim?.claimed) {
      console.log(`[Stripe Webhook]: Event ${event.id} is actively being processed by a concurrent thread.`)
      return NextResponse.json({ received: true, in_progress: true }, { status: 200 })
    }
  } catch (idempotencyErr) {
    console.error("[Stripe Webhook Idempotency Error]:", idempotencyErr)
    return NextResponse.json(
      { error: "Database error verifying webhook idempotency." },
      { status: 500 }
    )
  }

  // 2. Process event with centralized subscription synchronizer and charity allocation
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
          // Retrieve actual subscription state from Stripe and synchronize
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const syncResult = await syncSubscriptionFromStripe(subscription, {
            eventTimestamp: event.created,
          })
          console.log(`[Stripe Webhook]: Handled invoice.payment_succeeded for sub ${subscriptionId}`)

          // Record charitable allocation for this paid invoice
          if (invoice.amount_paid && invoice.amount_paid > 0) {
            await recordCharityAllocationFromInvoice(
              invoice,
              syncResult.userId,
              syncResult.subscriptionId
            )
          }
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
      console.error("[Stripe Webhook]: Critical failure marking event as processed:", markProcessedError)
      throw markProcessedError
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
