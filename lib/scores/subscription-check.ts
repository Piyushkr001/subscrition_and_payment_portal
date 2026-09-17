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
 */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionDetails | null> {
  if (!userId) return null

  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !subscription) {
    return {
      userId,
      status: "none",
      cancelAtPeriodEnd: false,
      isActive: false,
    }
  }

  const isActive =
    subscription.status === "active" || subscription.status === "trialing"

  return {
    id: subscription.id,
    userId: subscription.user_id,
    providerCustomerId: subscription.provider_customer_id,
    providerSubscriptionId: subscription.provider_subscription_id,
    stripePriceId: subscription.stripe_price_id,
    plan: subscription.plan,
    status: (subscription.status as SubscriptionStatus) || "none",
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
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
