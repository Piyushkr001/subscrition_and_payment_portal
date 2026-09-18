"use client"

import { useState } from "react"
import { ArrowRight, Check, CreditCard, Loader2, Sparkles, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button"
import { PLANS, formatPlanPrice, type PlanId } from "@/lib/stripe/config"
import type { UserSubscriptionDetails } from "@/lib/scores/subscription-check"

interface BillingClientProps {
  subscription: UserSubscriptionDetails | null
  initialPlan?: PlanId
  checkoutSuccess?: boolean
  checkoutCancelled?: boolean
}

export function BillingClient({
  subscription,
  initialPlan = "yearly",
  checkoutSuccess,
  checkoutCancelled,
}: BillingClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isActive = subscription?.isActive || false

  const handleStartCheckout = async (planId: PlanId) => {
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to initiate checkout session.")
      }

      window.location.assign(data.url)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Checkout error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Checkout Success Synchronization Banner */}
      {checkoutSuccess && (
        <Alert className="border-teal-500/30 bg-teal-500/10 text-foreground">
          <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
          <div>
            <AlertTitle className="text-sm font-semibold">
              Checkout Completed
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-0.5">
              We are confirming your subscription status with Stripe. Your membership will update automatically once synchronized.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Checkout Cancelled Banner */}
      {checkoutCancelled && (
        <Alert className="border-border bg-muted/40 text-foreground">
          <Info className="size-4 text-muted-foreground" />
          <div>
            <AlertTitle className="text-sm font-semibold">
              Checkout Cancelled
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-0.5">
              Checkout was cancelled. No changes or charges were made to your account.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm font-semibold">Checkout Error</AlertTitle>
          <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Status Card */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5 text-primary" />
                <span>Subscription Status</span>
              </CardTitle>
              <CardDescription>
                Authoritative membership state synchronized directly with Stripe PostgreSQL records.
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`text-xs capitalize font-semibold ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : subscription?.status === "past_due"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : ""
              }`}
            >
              {isActive
                ? `${subscription?.plan || "Active"} Plan`
                : subscription?.status || "Inactive"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isActive ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-muted-foreground">Billing Interval</span>
                  <p className="font-semibold text-foreground text-sm capitalize">
                    {subscription?.plan || "Standard"} Membership
                  </p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
                  <span className="text-muted-foreground">
                    {subscription?.cancelAtPeriodEnd ? "Access Expires On" : "Next Renewal Date"}
                  </span>
                  <p className="font-semibold text-foreground text-sm">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Active"}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <BillingPortalButton
                  variant="default"
                  className="w-full sm:w-auto font-semibold"
                  label="Manage Billing in Stripe Customer Portal"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">
                  An active ScoreKind membership is required to record Stableford rounds and enter monthly draws.
                </p>
                <p>
                  Select a plan below to continue to secure Stripe Checkout.
                </p>
              </div>

              {/* Plan Selection Cards */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                {(["monthly", "yearly"] as PlanId[]).map((planId) => {
                  const plan = PLANS[planId]
                  const isSelected = selectedPlan === planId

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border/70 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-foreground text-sm">{plan.name}</h4>
                        {plan.badge && (
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {plan.badge}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground">
                          {formatPlanPrice(plan)}
                        </span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </div>

                      {plan.subprice && (
                        <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                          {plan.subprice}
                        </p>
                      )}

                      <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[11px]">
                            <Check className="size-3 text-primary shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  size="lg"
                  disabled={loading}
                  onClick={() => handleStartCheckout(selectedPlan)}
                  className="w-full sm:w-auto font-semibold gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Connecting to Checkout...
                    </>
                  ) : (
                    <>
                      <span>Continue to Checkout ({PLANS[selectedPlan].name})</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>

                {subscription?.providerCustomerId && (
                  <BillingPortalButton
                    variant="outline"
                    label="Customer Portal"
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
