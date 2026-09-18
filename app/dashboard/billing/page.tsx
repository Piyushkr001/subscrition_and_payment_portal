import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getUserSubscription } from "@/lib/scores/subscription-check"
import { BillingClient } from "@/components/dashboard/billing-client"
import type { PlanId } from "@/lib/stripe/config"

export const metadata: Metadata = {
  title: "Billing & Subscription | ScoreKind",
  description: "Manage your ScoreKind membership, billing details, and payment options.",
}

interface BillingPageProps {
  searchParams: Promise<{
    plan?: string
    checkout_success?: string
    checkout?: string
  }>
}

export default async function DashboardBillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    const rawPlan = params.plan === "monthly" || params.plan === "yearly" ? params.plan : null
    const redirectUrl = rawPlan ? `/login?redirectTo=/dashboard/billing?plan=${rawPlan}` : "/login"
    redirect(redirectUrl)
  }

  const subscription = await getUserSubscription(user.id)
  const initialPlan: PlanId = params.plan === "monthly" ? "monthly" : "yearly"
  const checkoutSuccess = params.checkout_success === "true"
  const checkoutCancelled = params.checkout === "cancelled"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Billing & Membership
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your membership tier, synchronize billing changes, or update payment preferences.
        </p>
      </div>

      <BillingClient
        subscription={subscription}
        initialPlan={initialPlan}
        checkoutSuccess={checkoutSuccess}
        checkoutCancelled={checkoutCancelled}
      />
    </div>
  )
}
