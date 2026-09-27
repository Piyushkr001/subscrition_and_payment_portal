/**
 * ScoreKind Charitable Allocation Calculation Engine
 *
 * PROVISIONAL BUSINESS RULE SPECIFICATION:
 * -----------------------------------------
 * In this milestone, contribution allocations are calculated on the GROSS subscription
 * invoice amount paid (invoice.amount_paid) before processing fees or sales taxes.
 *
 * Example:
 *   Gross Payment: ₹1299.00 (129,900 paise)
 *   Contribution Percentage: 10%
 *   Allocated Minor Units: Math.round((129900 * 10) / 100) = 12990 paise
 *   Allocated Major Units: 129.90 (stored in numeric(10,2))
 *
 * Accounting Basis: Gross Paid Basis (Provisional)
 * Alternative future bases: Net of Stripe processing fees, Net of VAT/GST.
 * This function isolates the calculation so changing the financial basis is straightforward.
 */

export interface CalculateAllocationParams {
  /** Gross amount paid in integer minor currency units (e.g., cents or paise from invoice.amount_paid) */
  amountPaidMinor: number
  /** Contribution percentage selected by member (strictly 10 to 100) */
  percentage: number
  /** ISO 4217 lowercase currency string (e.g. 'inr', 'usd', 'gbp') */
  currency: string
}

export interface AllocationCalculationResult {
  /** Allocation amount in minor currency units (integer, e.g. paise/cents) */
  allocationAmountMinor: number
  /** Allocation amount formatted in major units (number with 2 decimals, e.g. 129.90) */
  allocationAmountMajor: number
  /** Validated percentage applied */
  percentage: number
  /** Normalized lowercase currency */
  currency: string
  /** Monetary accounting basis applied */
  basis: "gross_paid"
}

export function calculateCharityAllocation({
  amountPaidMinor,
  percentage,
  currency,
}: CalculateAllocationParams): AllocationCalculationResult {
  if (amountPaidMinor <= 0) {
    return {
      allocationAmountMinor: 0,
      allocationAmountMajor: 0,
      percentage,
      currency: currency.toLowerCase(),
      basis: "gross_paid",
    }
  }

  // Bound check percentage (minimum 10%, maximum 100%)
  const clampedPercentage = Math.min(100, Math.max(10, Math.round(percentage)))

  // Minor unit integer arithmetic (avoids floating point rounding drift)
  const allocationAmountMinor = Math.round((amountPaidMinor * clampedPercentage) / 100)
  const allocationAmountMajor = Number((allocationAmountMinor / 100).toFixed(2))

  return {
    allocationAmountMinor,
    allocationAmountMajor,
    percentage: clampedPercentage,
    currency: currency.toLowerCase(),
    basis: "gross_paid",
  }
}
