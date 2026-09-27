import type Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateCharityAllocation } from "./calculate-allocation"

export interface RecordAllocationResult {
  recorded: boolean
  contributionId?: string
  charityId?: string
  amount?: number
  percentage?: number
  currency?: string
  reason?: string
}

/**
 * Records a traceable charitable contribution allocation upon verified Stripe payment.
 *
 * Enforces:
 * 1. Idempotency: Protected against retried webhooks by idx_charity_contributions_invoice unique constraint.
 * 2. Real Payment Basis: Only records for invoices where amount_paid > 0.
 * 3. Documented Preference Rule:
 *    - Uses subscriber's active charity preference and percentage if present.
 *    - Fallback: If no preference is chosen yet, defaults to 10% allocated to the premier
 *      active featured partner charity (or first active charity).
 * 4. Historical Ledger: Records the exact allocation amount, percentage, and currency at invoice time.
 *    Subsequent preference updates will never rewrite this immutable ledger entry.
 */
export async function recordCharityAllocationFromInvoice(
  invoice: Stripe.Invoice,
  userId: string,
  subscriptionId?: string | null
): Promise<RecordAllocationResult> {
  const invoiceId = invoice.id
  const amountPaidMinor = invoice.amount_paid ?? 0
  const currency = (invoice.currency || "usd").toLowerCase()

  if (amountPaidMinor <= 0) {
    return {
      recorded: false,
      reason: `Invoice ${invoiceId} has non-positive amount paid (${amountPaidMinor}). No allocation recorded.`,
    }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Idempotency Check: Verify if an allocation already exists for this invoice ID
  const { data: existingContrib, error: checkError } = await supabaseAdmin
    .from("charity_contributions")
    .select("id, amount, charity_id, percentage")
    .eq("provider_invoice_id", invoiceId)
    .maybeSingle()

  if (checkError) {
    console.error("[Charity Allocation]: Error checking existing allocation:", checkError)
    throw checkError
  }

  if (existingContrib) {
    console.log(`[Charity Allocation]: Invoice ${invoiceId} already has recorded allocation (${existingContrib.id}). Idempotent skip.`)
    return {
      recorded: false,
      contributionId: existingContrib.id,
      charityId: existingContrib.charity_id,
      amount: existingContrib.amount,
      percentage: existingContrib.percentage,
      reason: "already_recorded",
    }
  }

  // 2. Fetch subscriber's charity preference
  const { data: userPref, error: prefError } = await supabaseAdmin
    .from("charity_preferences")
    .select("charity_id, contribution_percentage")
    .eq("user_id", userId)
    .maybeSingle()

  if (prefError) {
    console.error("[Charity Allocation]: Error fetching user charity preference:", prefError)
    throw prefError
  }

  let resolvedCharityId: string | null = null
  let resolvedPercentage = 10

  if (userPref?.charity_id) {
    // Verify that the preferred charity exists and is active
    const { data: prefCharity } = await supabaseAdmin
      .from("charities")
      .select("id, status")
      .eq("id", userPref.charity_id)
      .maybeSingle()

    if (prefCharity && prefCharity.status === "active") {
      resolvedCharityId = prefCharity.id
      resolvedPercentage = userPref.contribution_percentage
    }
  }

  // Fallback: If no preference is selected or preferred charity is inactive, assign to default active cause
  if (!resolvedCharityId) {
    const { data: defaultCharities, error: defaultError } = await supabaseAdmin
      .from("charities")
      .select("id")
      .eq("status", "active")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)

    if (defaultError) {
      console.error("[Charity Allocation]: Error looking up default charity:", defaultError)
      throw defaultError
    }

    if (defaultCharities && defaultCharities.length > 0) {
      resolvedCharityId = defaultCharities[0].id
      resolvedPercentage = 10 // Guaranteed minimum 10%
      console.log(`[Charity Allocation]: User ${userId} has no active preference. Falling back to default partner charity ${resolvedCharityId} at 10%.`)
    }
  }

  if (!resolvedCharityId) {
    console.warn(`[Charity Allocation]: No active partner charities found in database. Cannot record allocation for invoice ${invoiceId}.`)
    return {
      recorded: false,
      reason: "no_active_charities_available",
    }
  }

  // 3. Compute allocation with documented monetary engine
  const calculation = calculateCharityAllocation({
    amountPaidMinor,
    percentage: resolvedPercentage,
    currency,
  })

  // 4. Insert allocation ledger record
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("charity_contributions")
    .insert({
      user_id: userId,
      charity_id: resolvedCharityId,
      subscription_id: subscriptionId || null,
      provider_invoice_id: invoiceId,
      currency,
      amount: calculation.allocationAmountMajor,
      percentage: calculation.percentage,
      type: "subscription",
      status: "completed", // Denotes successful ledger allocation (NOT remitted to charity yet)
    })
    .select("id")
    .maybeSingle()

  if (insertError) {
    // If unique constraint conflict on provider_invoice_id from concurrent execution:
    if (insertError.code === "23505") {
      console.log(`[Charity Allocation]: Handled concurrent unique constraint for invoice ${invoiceId}.`)
      return {
        recorded: false,
        reason: "already_recorded_concurrently",
      }
    }
    console.error("[Charity Allocation]: Failed to insert charity contribution:", insertError)
    throw insertError
  }

  console.log(
    `[Charity Allocation]: Successfully recorded ${calculation.currency.toUpperCase()} ${calculation.allocationAmountMajor} (${calculation.percentage}%) for invoice ${invoiceId} -> charity ${resolvedCharityId}`
  )

  return {
    recorded: true,
    contributionId: inserted?.id,
    charityId: resolvedCharityId,
    amount: calculation.allocationAmountMajor,
    percentage: calculation.percentage,
    currency,
  }
}
