import { Award, Calendar, CheckCircle2, DollarSign, HeartHandshake, History, LayoutDashboard, Sparkles, TrendingUp, Trophy, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function DashboardPreview() {
  const memberScores = [
    { score: 37, date: "Sep 08", course: "Wentworth" },
    { score: 35, date: "Aug 29", course: "St. Andrews" },
    { score: 32, date: "Aug 18", course: "Royal Oak" },
    { score: 31, date: "Aug 06", course: "Cypress Pt" },
    { score: 28, date: "Jul 24", course: "Sun Valley" },
  ]

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <LayoutDashboard className="size-3 text-teal-600 dark:text-teal-400" />
            MEMBER PORTAL PREVIEW
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything in one{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              intuitive dashboard.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A comprehensive look at what members see every day: score sets, draw eligibility,
            charity contributions, and prize draw confirmations.
          </p>
        </div>

        {/* Dashboard Mockup Frame */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-teal-950/10 dark:shadow-none">
          {/* Top Mockup Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-sm">
                SK
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  ScoreKind Member Portal
                </h3>
                <p className="text-xs text-muted-foreground">
                  Member ID: #SK-84920 · Member since 2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Subscription: Active (Annual)
              </Badge>
            </div>
          </div>

          {/* Dashboard Body Content */}
          <div className="p-6 sm:p-8">
            {/* Top 3 Quick Stats Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {/* Stat 1: Next Draw */}
              <div className="flex-1 min-w-55 rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Next Monthly Draw
                  </span>
                  <Trophy className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    12 Days
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · Oct 1st
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="size-3" />
                  <span>5-Score Set Confirmed</span>
                </div>
              </div>

              {/* Stat 2: Cause Allocation */}
              <div className="flex-1 min-w-55 rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Charity Allocation
                  </span>
                  <HeartHandshake className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    15%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of membership
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">
                  Grassroots Youth Sports Trust
                </div>
              </div>

              {/* Stat 3: Performance Trend */}
              <div className="flex-1 min-w-55 rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Rolling Stableford Avg
                  </span>
                  <TrendingUp className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    32.6 pts
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    +2.4 pts
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  Higher than platform median
                </div>
              </div>
            </div>

            {/* Middle Section: Active 5-Score Strip */}
            <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Active 5-Score Participation Set
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    These 5 numbers represent your qualifying draw ticket for the upcoming cycle.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs"
                >
                  Status: Draw Ready
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {memberScores.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-1 min-w-22.5 flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-3 shadow-xs"
                  >
                    <span className="text-xs text-muted-foreground font-medium">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl font-black text-foreground my-0.5">
                      {item.score}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Details Row */}
            <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-6 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                <span>Renewal Date: <strong>14 Aug 2027</strong></span>
                <span>·</span>
                <span>Pledge Recipient: <strong>Youth Athletics Fund</strong></span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
                <span>Transparent Monthly Reporting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
