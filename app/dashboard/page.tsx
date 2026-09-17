import Link from "next/link"
import {
  CreditCard,
  Target,
  Trophy,
  HeartHandshake,
  Gift,
  ArrowRight,
  PlusCircle,
  Sparkles,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getLatestScores } from "@/lib/scores/actions"
import { getUserSubscription } from "@/lib/scores/subscription-check"
import { formatScoreDate } from "@/components/scores/score-card"
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button"

interface DashboardPageProps {
  searchParams: Promise<{ checkout_success?: string }>
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()
  const subscription = user ? await getUserSubscription(user.id) : null
  const latestScores = await getLatestScores(5)

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "Golfer"

  return (
    <div className="space-y-8">
      {/* Checkout Success Synchronization Banner */}
      {searchParams.checkout_success === "true" && (
        <Alert className="border-teal-500/30 bg-teal-500/10 text-foreground">
          <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
          <div>
            <AlertTitle className="text-sm font-semibold">
              Payment Received!
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground mt-0.5">
              Your subscription is being synchronized directly from Stripe. If your status has not yet updated to Active, please refresh the page in a few moments.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Welcome Hero Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <Badge variant="outline" className="text-xs">
              Subscriber Portal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track your Stableford game, support verified causes, and enter
            monthly prize draws.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            render={<Link href="/dashboard/scores" />}
            className="rounded-xl shadow-sm"
          >
            <PlusCircle className="mr-2 size-4" />
            Enter Score
          </Button>
        </div>
      </div>

      {/* 5 Core Feature Modules with Truthful Empty States */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Subscription Status */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Membership Status
            </CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                  {subscription?.isActive
                    ? "Active"
                    : subscription?.status === "past_due"
                    ? "Past Due"
                    : subscription?.status === "cancelled"
                    ? "Cancelled"
                    : "Inactive"}
                </span>
                <Badge
                  variant={
                    subscription?.isActive
                      ? "default"
                      : subscription?.status === "past_due"
                      ? "destructive"
                      : "secondary"
                  }
                  className={`text-[11px] ${
                    subscription?.isActive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                      : ""
                  }`}
                >
                  {subscription?.isActive
                    ? subscription.plan === "yearly"
                      ? "Annual Plan"
                      : "Monthly Plan"
                    : subscription?.status === "past_due"
                    ? "Payment Failed"
                    : "No Active Plan"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {subscription?.isActive
                  ? subscription.cancelAtPeriodEnd
                    ? `Your membership cancels at the end of the current period on ${
                        subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")
                          : "renewal date"
                      }.`
                    : `Renews on ${
                        subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")
                          : "end of period"
                      }. Full Stableford tracking & prize draw access enabled.`
                  : subscription?.status === "past_due"
                  ? "Your recent membership payment attempt was unsuccessful. Please update your payment method in the portal."
                  : "Activate your monthly or annual membership to participate in prize draws and automate charitable giving."}
              </p>
            </div>

            {subscription?.providerCustomerId ? (
              <BillingPortalButton
                className="w-full justify-between"
                label="Manage Billing & Invoices"
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                render={<Link href="/#pricing" />}
              >
                <span>View Membership Plans</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 2. Latest Scores */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Latest Stableford Scores
            </CardTitle>
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400">
              <Target className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                  {latestScores.length} of 5 Recorded
                </span>
                {latestScores.length === 5 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                    Complete
                  </Badge>
                )}
              </div>

              {latestScores.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  No scores added yet. Enter your latest 18-hole Stableford scores
                  (1–45 pts) to build your rolling-five draw pool.
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {latestScores.slice(0, 3).map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1 text-xs"
                    >
                      <span className="font-semibold text-foreground">
                        {s.score} pts
                      </span>
                      <span className="text-muted-foreground">
                        {formatScoreDate(s.score_date)}
                        {idx === 0 ? " (Latest)" : ""}
                      </span>
                    </div>
                  ))}
                  {latestScores.length > 3 && (
                    <p className="text-[11px] text-muted-foreground text-center pt-0.5">
                      +{latestScores.length - 3} more round in active set
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              render={<Link href="/dashboard/scores" />}
            >
              <span>{latestScores.length > 0 ? "Manage Scores" : "Record Stableford Score"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 3. Selected Charity */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Selected Charity
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <HeartHandshake className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xl font-bold text-foreground">
                None Selected
              </span>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Choose a verified cause to receive your guaranteed 10%+
                subscription contribution.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              render={<Link href="/dashboard/charity" />}
            >
              <span>Choose Your Charity</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 4. Next Draw */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Monthly Draw
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Trophy className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xl font-bold text-foreground">
                Upcoming
              </span>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                No upcoming draw available yet. Draws occur at the end of each
                calendar month.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              render={<Link href="/dashboard/draws" />}
            >
              <span>View Draw Rules & History</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 5. Winnings */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Member Winnings
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Gift className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xl font-bold text-foreground">
                $0.00
              </span>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                No winnings yet. Match 3, 4, or 5 numbers in the monthly draw to
                claim verified prizes.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              render={<Link href="/dashboard/winnings" />}
            >
              <span>View Winnings & Proofs</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* 6. System Security & Role Status */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Account Security
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">
                  Verified
                </span>
                <Badge variant="outline" className="text-[11px] uppercase">
                  {profile?.role || "Subscriber"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Authenticated via Supabase JWT session with Row Level Security
                enforced on all data queries.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              render={<Link href="/dashboard/settings" />}
            >
              <span>Account Settings</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
