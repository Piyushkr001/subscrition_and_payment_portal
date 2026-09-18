import { createClient } from "@/lib/supabase/server"
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database"

export interface ScoreAccessResult {
  allowed: boolean
  status: SubscriptionStatus | "none" | "admin"
  plan?: SubscriptionPlan | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  reason?: string
}

export interface UserSubscriptionDetails {
  id?: string
  userId: string
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  stripePriceId?: string | null
  plan?: SubscriptionPlan | null
  status: SubscriptionStatus | "none"
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd: boolean
  isActive: boolean
}

/**
 * Retrieve current user's active or latest subscription details from PostgreSQL.
 * Deterministically prioritizes active/trialing subscriptions with valid period dates
 * rather than naively picking the newest created row.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionDetails | null> {
  if (!userId) return null

  const supabase = await createClient()

  // 1. Query all subscriptions for user to resolve deterministic current state
  const { data: userSubs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error || !userSubs || userSubs.length === 0) {
    return {
      userId,
      status: "none",
      cancelAtPeriodEnd: false,
      isActive: false,
    }
  }

  const nowIso = new Date().toISOString()

  // 2. Deterministic priority resolution:
  // Priority A: Active or trialing subscription with valid period date
  const activeSub = userSubs.find(
    (s) =>
      (s.status === "active" || s.status === "trialing") &&
      (!s.current_period_end || s.current_period_end > nowIso)
  )

  // Priority B: Past-due subscription needing billing recovery
  const pastDueSub = userSubs.find((s) => s.status === "past_due")

  // Priority C: Most recently updated/created subscription row
  const currentSub = activeSub || pastDueSub || userSubs[0]

  const isActive =
    (currentSub.status === "active" || currentSub.status === "trialing") &&
    (!currentSub.current_period_end || currentSub.current_period_end > nowIso)

  return {
    id: currentSub.id,
    userId: currentSub.user_id,
    providerCustomerId: currentSub.provider_customer_id,
    providerSubscriptionId: currentSub.provider_subscription_id,
    stripePriceId: currentSub.stripe_price_id,
    plan: currentSub.plan,
    status: (currentSub.status as SubscriptionStatus) || "none",
    currentPeriodStart: currentSub.current_period_start,
    currentPeriodEnd: currentSub.current_period_end,
    cancelAtPeriodEnd: currentSub.cancel_at_period_end || false,
    isActive,
  }
}

/**
 * Real Subscription Access Control Guard
 *
 * Enforces:
 * 1. User authentication.
 * 2. Role bypass for administrators.
 * 3. Verified active or trialing subscription in public.subscriptions.
 * Non-subscribed or past_due users are restricted from mutating Stableford scores
 * and entering monthly draws.
 */
export async function canManageScores(userId: string): Promise<ScoreAccessResult> {
  if (!userId) {
    return {
      allowed: false,
      status: "none",
      reason: "Authentication required to manage Stableford scores.",
    }
  }

  const supabase = await createClient()

  // 1. Verify profile existence and user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (!profile) {
    return {
      allowed: false,
      status: "none",
      reason: "User profile not found.",
    }
  }

  // Admins always have full access
  if (profile.role === "admin") {
    return {
      allowed: true,
      status: "admin",
    }
  }

  // 2. Query subscription table for active record
  const userSub = await getUserSubscription(userId)

  if (!userSub || !userSub.isActive) {
    return {
      allowed: false,
      status: userSub?.status || "none",
      plan: userSub?.plan,
      currentPeriodEnd: userSub?.currentPeriodEnd,
      cancelAtPeriodEnd: userSub?.cancelAtPeriodEnd,
      reason:
        "An active ScoreKind membership is required to record Stableford scores and enter monthly prize draws.",
    }
  }

  return {
    allowed: true,
    status: userSub.status,
    plan: userSub.plan,
    currentPeriodEnd: userSub.currentPeriodEnd,
    cancelAtPeriodEnd: userSub.cancelAtPeriodEnd,
  }
}
