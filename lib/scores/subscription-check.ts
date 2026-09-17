import { createClient } from "@/lib/supabase/server"

export interface ScoreAccessResult {
  allowed: boolean
  reason?: string
  status?: string
}

/**
 * Clean Subscription Gating Abstraction for Score Management
 *
 * NOTE: Stripe payment processing & subscription billing will be implemented
 * in the subsequent milestone (Milestone: Stripe Subscription System).
 *
 * POLICY FOR CURRENT MILESTONE:
 * - Authenticated subscribers are granted access to manage scores so the
 *   Stableford scoring engine, rolling-five derivations, and history can be
 *   tested and used.
 * - Once Stripe is active, this check will query `public.subscriptions`
 *   for an active/trialing status and restrict scoring when unpaid or lapsed.
 */
export async function canManageScores(userId: string): Promise<ScoreAccessResult> {
  if (!userId) {
    return {
      allowed: false,
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
      reason: "User profile not found.",
    }
  }

  // Admins always have access
  if (profile.role === "admin") {
    return { allowed: true }
  }

  // 2. Query subscription table for existing record if any
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle()

  // Future enforcement point:
  // When Stripe milestone is deployed, uncomment strict status check:
  // if (!subscription || subscription.status !== "active") {
  //   return { allowed: false, reason: "Active subscription required.", status: subscription?.status || "none" }
  // }

  // Current milestone development mode: Allow authenticated subscribers
  return {
    allowed: true,
    status: subscription?.status || "pending_stripe_milestone",
  }
}
