import type Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database"

export interface SyncSubscriptionOptions {
  eventTimestamp?: number
  userId?: string
  fallbackPlan?: SubscriptionPlan
}

export interface SyncResult {
  userId: string
  subscriptionId: string
  status: SubscriptionStatus
  plan: SubscriptionPlan
  isNew: boolean
}

/**
 * Strict fail-closed subscription status normalizer.
 * UNKNOWN OR UNSUPPORTED STATUS MUST NEVER GRANT ACCESS.
 * Canonicalizes 'canceled' (Stripe default) -> 'cancelled' (ScoreKind standard).
 */
export function normalizeSubscriptionStatus(
  status: Stripe.Subscription.Status | string | null | undefined
): SubscriptionStatus {
  if (!status) {
    return "incomplete"
  }

  switch (status) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
    case "cancelled":
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
      // FAIL-CLOSED: Any unrecognized status is restricted as incomplete. NEVER active.
      console.warn(`[Subscription Sync]: Encountered unknown status '${status}', failing closed to 'incomplete'.`)
      return "incomplete"
  }
}

/**
 * Resolves membership plan ('monthly' or 'yearly') from interval or metadata.
 */
export function resolvePlan(
  interval?: string | null,
  overridePlan?: SubscriptionPlan | null
): SubscriptionPlan {
  if (overridePlan === "monthly" || overridePlan === "yearly") {
    return overridePlan
  }
  return interval === "year" ? "yearly" : "monthly"
}

/**
 * Safely extracts period timestamps from Stripe Subscription object.
 */
export function extractSubscriptionPeriod(subscription: Stripe.Subscription) {
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

/**
 * Centralized, idempotent synchronization of Stripe subscription state into PostgreSQL.
 *
 * Enforces:
 * 1. Fail-closed status normalization
 * 2. Dedicated customer mapping persistence in public.stripe_customers
 * 3. Out-of-order event protection using last_stripe_event_timestamp
 * 4. Strict error handling (never ignores Supabase errors; throws so webhook retries)
 */
export async function syncSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  options: SyncSubscriptionOptions = {}
): Promise<SyncResult> {
  const supabaseAdmin = createAdminClient()
  const subscriptionId = subscription.id

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id

  if (!customerId) {
    throw new Error(`[Subscription Sync Error]: Missing customer on Stripe subscription ${subscriptionId}`)
  }

  // 1. Resolve internal ScoreKind user_id
  let resolvedUserId: string | null =
    options.userId ||
    subscription.metadata?.userId ||
    null

  // Look up dedicated stripe_customers table if not resolved from metadata
  if (!resolvedUserId) {
    const { data: customerRow, error: customerLookupError } = await supabaseAdmin
      .from("stripe_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle()

    if (customerLookupError) {
      console.error("[Subscription Sync]: Error looking up stripe_customers:", customerLookupError)
      throw customerLookupError
    }

    if (customerRow?.user_id) {
      resolvedUserId = customerRow.user_id
    }
  }

  // Fallback: look up historical subscriptions table by customer ID
  if (!resolvedUserId) {
    const { data: subRow, error: subLookupError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("provider_customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subLookupError) {
      console.error("[Subscription Sync]: Error looking up subscription by customer:", subLookupError)
      throw subLookupError
    }

    if (subRow?.user_id) {
      resolvedUserId = subRow.user_id
    }
  }

  if (!resolvedUserId) {
    throw new Error(
      `[Subscription Sync Error]: Could not resolve ScoreKind user for Stripe subscription ${subscriptionId} (customer: ${customerId}).`
    )
  }

  // 2. Persist customer mapping in stripe_customers if not yet present
  const { error: customerUpsertError } = await supabaseAdmin
    .from("stripe_customers")
    .upsert(
      {
        user_id: resolvedUserId,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (customerUpsertError) {
    console.error("[Subscription Sync]: Error persisting stripe_customers:", customerUpsertError)
    throw customerUpsertError
  }

  // 3. Extract subscription metadata & period
  const priceId = subscription.items?.data?.[0]?.price?.id || null
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval
  const plan = resolvePlan(
    interval,
    (subscription.metadata?.plan as SubscriptionPlan) || options.fallbackPlan
  )
  const status = normalizeSubscriptionStatus(subscription.status)
  const { periodStart, periodEnd } = extractSubscriptionPeriod(subscription)
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ?? false

  // 4. Check for existing subscription by provider_subscription_id
  const { data: existingSub, error: findError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, last_stripe_event_timestamp")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle()

  if (findError) {
    console.error("[Subscription Sync]: Error finding existing subscription:", findError)
    throw findError
  }

  // 5. Out-of-order check
  if (
    existingSub &&
    options.eventTimestamp &&
    existingSub.last_stripe_event_timestamp &&
    options.eventTimestamp < existingSub.last_stripe_event_timestamp
  ) {
    console.warn(
      `[Subscription Sync]: Skipping stale event (${options.eventTimestamp} < ${existingSub.last_stripe_event_timestamp}) for sub ${subscriptionId}`
    )
    return {
      userId: resolvedUserId,
      subscriptionId,
      status,
      plan,
      isNew: false,
    }
  }

  const newEventTimestamp = options.eventTimestamp || Math.floor(Date.now() / 1000)

  if (existingSub) {
    // Update existing subscription record
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        provider_customer_id: customerId,
        stripe_price_id: priceId,
        plan,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        last_stripe_event_timestamp: newEventTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id)

    if (updateError) {
      console.error("[Subscription Sync Error]: Failed to update subscription:", updateError)
      throw updateError
    }

    return {
      userId: resolvedUserId,
      subscriptionId,
      status,
      plan,
      isNew: false,
    }
  }

  // Check if placeholder row exists for user with NULL provider_subscription_id
  const { data: placeholderSub, error: placeholderError } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", resolvedUserId)
    .is("provider_subscription_id", null)
    .maybeSingle()

  if (placeholderError) {
    console.error("[Subscription Sync]: Error checking placeholder row:", placeholderError)
    throw placeholderError
  }

  if (placeholderSub) {
    const { error: updatePlaceholderError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        provider_customer_id: customerId,
        provider_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        plan,
        status,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
        last_stripe_event_timestamp: newEventTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", placeholderSub.id)

    if (updatePlaceholderError) {
      console.error("[Subscription Sync Error]: Failed to update placeholder subscription:", updatePlaceholderError)
      throw updatePlaceholderError
    }

    return {
      userId: resolvedUserId,
      subscriptionId,
      status,
      plan,
      isNew: true,
    }
  }

  // Insert brand new subscription record
  const { error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: resolvedUserId,
      provider_customer_id: customerId,
      provider_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan,
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      last_stripe_event_timestamp: newEventTimestamp,
    })

  if (insertError) {
    console.error("[Subscription Sync Error]: Failed to insert subscription:", insertError)
    throw insertError
  }

  return {
    userId: resolvedUserId,
    subscriptionId,
    status,
    plan,
    isNew: true,
  }
}
