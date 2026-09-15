import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  HeartHandshake,
  Sparkles,
  Trophy,
  TrendingUp,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function HeroSection() {
  const latestScores = [
    { score: 37, date: "Sep 08", course: "Pine Valley" },
    { score: 35, date: "Aug 29", course: "St. Andrews" },
    { score: 32, date: "Aug 18", course: "Royal Oak" },
    { score: 31, date: "Aug 06", course: "Cypress Pt" },
    { score: 28, date: "Jul 24", course: "Sun Valley" },
  ]

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Background radial gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-152 w-200 -translate-x-1/2 rounded-full bg-linear-to-tr from-teal-500/15 via-emerald-500/10 to-transparent blur-3xl dark:from-teal-500/10 dark:via-emerald-500/5"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          {/* Left Column: Headline & Value Proposition */}
          <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
            {/* Eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
              <span className="flex size-2 rounded-full bg-teal-500 animate-pulse" />
              <span>PLAY WITH PURPOSE</span>
              <Sparkles className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Your Scores Can{" "}
              <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
                Make a Difference.
              </span>
            </h1>

            {/* Sub-copy */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              ScoreKind connects your golf performance with real-world impact.
              Maintain your latest 5 Stableford scores, enter transparent monthly
              prize draws, and direct at least 10% of your membership to a charity
              you choose.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex w-full flex-col gap-3.5 sm:w-auto sm:flex-row sm:items-center">
              <Button
                size="lg"
                render={<Link href="/signup" />}
                className="group h-12 w-full rounded-xl bg-linear-to-r from-teal-700 to-emerald-600 px-6 font-semibold text-white shadow-md shadow-teal-700/20 transition-all hover:from-teal-800 hover:to-emerald-700 hover:shadow-lg sm:w-auto"
              >
                <span>Join ScoreKind</span>
                <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                render={<Link href="#how-it-works" />}
                className="h-12 w-full rounded-xl border-border bg-background/60 px-6 font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted/80 sm:w-auto"
              >
                See How It Works
              </Button>
            </div>

            {/* Supporting Micro-copy */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm lg:justify-start">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Monthly & yearly memberships</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>10%+ minimum charity allocation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Composite Interactive Product Preview */}
          <div className="relative flex w-full max-w-lg flex-col lg:w-1/2">
            {/* Ambient Backlight Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-tr from-teal-500/20 via-emerald-500/15 to-transparent blur-2xl rounded-3xl"
            />

            <Card className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 p-6 shadow-xl shadow-teal-950/5 backdrop-blur-md dark:shadow-none">
              {/* Header inside mockup */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Active Member Portal
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Stableford Rolling System
                    </p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="gap-1 border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Eligible for Draw
                </Badge>
              </div>

              {/* Latest 5 Scores Track */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Latest 5 Scores (1–45)
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Avg: 32.6 pts
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  {latestScores.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/30 p-2.5 transition-colors hover:border-teal-500/40 hover:bg-teal-500/5"
                    >
                      <span className="text-lg font-bold text-foreground">
                        {item.score}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {item.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Draw Summary */}
              <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Trophy className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        September Prize Draw
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        3-Match · 4-Match · 5-Match Rollover
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-border/80 text-[11px]"
                  >
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>In 12 days</span>
                  </Badge>
                </div>
              </div>

              {/* Charity Contribution Highlight */}
              <div className="mt-4 rounded-xl border border-teal-500/25 bg-linear-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-300">
                      <HeartHandshake className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Selected Charity
                      </p>
                      <p className="text-[11px] text-teal-800 dark:text-teal-300">
                        Community Youth Sports
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-teal-700 dark:text-teal-400">
                      15%
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      of membership
                    </p>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[60%] rounded-full bg-linear-to-r from-teal-600 to-emerald-500" />
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Minimum 10% required · You chose to contribute 15%
                </p>
              </div>

              {/* Bottom Security / Trust Pill */}
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Audited Draw Mechanics</span>
                </div>
                <span>Rolling 5-Game Window</span>
              </div>
            </Card>

            {/* Floating Accent Pill: Top Right */}
            <div className="absolute -top-4 -right-3 hidden rounded-full border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md sm:flex sm:items-center sm:gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Draws on the 1st of every month</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
