"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { PLANS, formatPlanPrice, type PlanId } from "@/lib/stripe/config"

export function PricingSection() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<PlanId>("yearly")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setIsAuthenticated(!!session?.user)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const handleSubscribe = async (planId: PlanId) => {
    setErrorMessage(null)

    // 1. If unauthenticated, redirect to signup with plan parameter
    if (!isAuthenticated) {
      router.push(`/signup?plan=${planId}`)
      return
    }

    // 2. If authenticated, create Stripe Checkout Session
    try {
      setLoadingPlan(planId)
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to start checkout session.")
      }

      window.location.assign(data.url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout error occurred."
      setErrorMessage(msg)
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      ...PLANS.monthly,
      price: formatPlanPrice(PLANS.monthly),
      popular: billingCycle === "monthly",
    },
    {
      ...PLANS.yearly,
      price: formatPlanPrice(PLANS.yearly),
      popular: billingCycle === "yearly",
    },
  ]

  return (
    <section id="pricing" className="relative py-16 sm:py-20 lg:py-28 scroll-mt-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <Sparkles className="size-3 text-teal-600 dark:text-teal-400" />
            MEMBERSHIP PLANS
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple, purpose-driven{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              membership.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Choose the membership that fits your playing cadence. Every plan includes
            score tracking, monthly draws, and guaranteed charity donations.
          </p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center rounded-xl border border-border/80 bg-muted/40 p-1">
              <Button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly Billing
              </Button>
              <Button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded-md bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                  Save 20%
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid using Flexbox */}
        <div className="mt-12 flex flex-col gap-8 max-w-4xl mx-auto lg:flex-row lg:items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
                plan.popular
                  ? "border-teal-500/50 bg-linear-to-b from-card via-card to-teal-500/5 shadow-xl shadow-teal-950/10 dark:border-teal-500/40"
                  : "border-border/70 bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 rounded-bl-xl bg-linear-to-r from-teal-700 to-emerald-600 px-3.5 py-1 text-[11px] font-bold text-white">
                  RECOMMENDED
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                    {plan.price}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {plan.period}
                  </span>
                </div>

                {plan.subprice && (
                  <p className="mt-1 text-xs text-teal-700 dark:text-teal-400 font-medium">
                    {plan.subprice}
                  </p>
                )}

                <div className="mt-6 border-t border-border/50 pt-6">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    What&apos;s Included:
                  </span>

                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-foreground">
                        <Check className="size-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  size="lg"
                  disabled={loadingPlan !== null}
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? "bg-linear-to-r from-teal-700 to-emerald-600 text-white shadow-md shadow-teal-700/20 hover:from-teal-800 hover:to-emerald-700"
                      : "border border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Connecting to Checkout...
                    </>
                  ) : (
                    <>
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
                <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                  No hidden fees · 10%+ charity guarantee
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
