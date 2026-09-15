import { Calendar, Check, Repeat, ShieldCheck, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function DrawSection() {
  const tiers = [
    {
      match: "3-Number Match",
      allocation: "25%",
      title: "Community Tier",
      description: "Match any 3 numbers from your active 5-score set against the drawn numbers.",
      feature: "Highest win probability",
      rollover: false,
      highlight: false,
    },
    {
      match: "4-Number Match",
      allocation: "35%",
      title: "Performance Tier",
      description: "Match any 4 numbers from your active 5-score set for a substantial prize share.",
      feature: "Evenly split among matching members",
      rollover: false,
      highlight: false,
    },
    {
      match: "5-Number Match",
      allocation: "40%",
      title: "Jackpot Tier",
      description: "Match all 5 numbers from your active score set to claim the primary prize pool.",
      feature: "Carries forward to next month if unclaimed",
      rollover: true,
      highlight: true,
    },
  ]

  return (
    <section id="draws" className="relative py-16 sm:py-20 lg:py-28 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <Trophy className="size-3 text-teal-600 dark:text-teal-400" />
            TRANSPARENT PRIZE DRAWS
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Every month brings{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              another opportunity.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            ScoreKind operates a transparent monthly reward draw based on your
            active 5-score Stableford set. A trustworthy, audited process where
            rewards are shared among qualifying members.
          </p>
        </div>

        {/* 3 Tiers Cards (Flexbox) */}
        <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {tiers.map((tier, idx) => (
            <Card
              key={idx}
              className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                tier.highlight
                  ? "border-teal-500/50 bg-linear-to-b from-card via-card to-teal-500/5 shadow-xl shadow-teal-950/10 dark:border-teal-500/40"
                  : "border-border/70 bg-card hover:border-border"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -right-12 top-6 rotate-45 bg-linear-to-r from-teal-600 to-emerald-500 px-12 py-1 text-[10px] font-bold text-white shadow-sm">
                  JACKPOT TIER
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={tier.highlight ? "default" : "secondary"}
                    className={
                      tier.highlight
                        ? "bg-teal-700 text-white hover:bg-teal-800"
                        : "text-muted-foreground"
                    }
                  >
                    {tier.match}
                  </Badge>

                  {tier.rollover && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <Repeat className="size-3.5" />
                      <span>Rollover Enabled</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                    {tier.allocation}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    of prize pool
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-foreground">
                  {tier.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="mt-6 border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Check className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>{tier.feature}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mechanics & Assurance Bar */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-muted/20 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Fair Split & Jackpot Rollover Rules
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                  If multiple members achieve the same match level, the corresponding
                  tier pool is divided equally. If the 5-number match is not won in any
                  given month, the entire 40% allocation rolls over into the next
                  month’s jackpot.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Badge
                variant="outline"
                className="gap-1.5 border-border py-1.5 px-3 text-xs text-foreground"
              >
                <Calendar className="size-3.5 text-teal-600 dark:text-teal-400" />
                <span>Draw on the 1st of every month</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
