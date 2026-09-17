export type PlanId = "monthly" | "yearly"

export interface PlanConfig {
  id: PlanId
  name: string
  period: string
  priceAmount: number
  currency: string
  currencySymbol: string
  interval: "month" | "year"
  stripePriceId: string
  badge?: string
  subprice?: string
  description: string
  features: string[]
  ctaText: string
}

export const PLANS: Record<PlanId, PlanConfig> = {
  monthly: {
    id: "monthly",
    name: "Monthly Membership",
    period: "/ month",
    priceAmount: Number(process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_AMOUNT) || 1299,
    currency: (process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "inr").toLowerCase(),
    currencySymbol: process.env.NEXT_PUBLIC_STRIPE_CURRENCY_SYMBOL || "₹",
    interval: "month",
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
    badge: "Flexible",
    description: "Complete ScoreKind experience with total month-to-month flexibility.",
    features: [
      "Full rolling 5-score Stableford tracker (1–45)",
      "Automated entry into all monthly prize draws",
      "3-tier prize eligibility (3, 4, or 5 numbers)",
      "Minimum 10% pledged to your chosen charity",
      "Member dashboard & score verification tools",
      "Cancel, pause, or switch tiers anytime",
    ],
    ctaText: "Start Monthly Plan",
  },
  yearly: {
    id: "yearly",
    name: "Annual Membership",
    period: "/ year",
    priceAmount: Number(process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_AMOUNT) || 11999,
    currency: (process.env.NEXT_PUBLIC_STRIPE_CURRENCY || "inr").toLowerCase(),
    currencySymbol: process.env.NEXT_PUBLIC_STRIPE_CURRENCY_SYMBOL || "₹",
    interval: "year",
    stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || "",
    badge: "Best Value · Save 20%",
    subprice: "Equivalent to ~₹999/month",
    description: "Our most popular membership for committed golfers and regular givers.",
    features: [
      "Everything included in the monthly membership",
      "12 consecutive monthly prize draw entries",
      "Continuous 10%+ charity contribution pledge",
      "Eligibility for all 5-number jackpot rollovers",
      "Priority charity impact reporting & certificates",
      "Best annual rate with 2 months free",
    ],
    ctaText: "Start Annual Plan",
  },
}

/**
 * Format plan price with configured currency symbol.
 */
export function formatPlanPrice(plan: PlanConfig): string {
  const formattedNumber = plan.priceAmount.toLocaleString("en-IN")
  return `${plan.currencySymbol}${formattedNumber}`
}

/**
 * Safely retrieve plan configuration by identifier.
 */
export function getPlanConfig(planId: string): PlanConfig | null {
  if (planId === "monthly" || planId === "yearly") {
    return PLANS[planId]
  }
  return null
}
