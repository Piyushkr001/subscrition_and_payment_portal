import { CalendarDays, HeartHandshake, ListOrdered, Trophy } from "lucide-react"

export function ImpactStrip() {
  const highlights = [
    {
      icon: ListOrdered,
      title: "5 Latest Scores",
      description: "Rolling Stableford (1–45) performance set",
    },
    {
      icon: CalendarDays,
      title: "Monthly Prize Draws",
      description: "Scheduled on the 1st of every calendar month",
    },
    {
      icon: HeartHandshake,
      title: "10%+ Direct Giving",
      description: "Minimum 10% pledged to your chosen charity",
    },
    {
      icon: Trophy,
      title: "3 Reward Tiers",
      description: "3, 4, or 5-match with top-tier rollover",
    },
  ]

  return (
    <section className="relative border-y border-border/60 bg-muted/20 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 sm:gap-8">
          {highlights.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="flex flex-1 min-w-60 items-center gap-4 rounded-xl border border-border/40 bg-card/60 p-4 transition-all hover:border-teal-500/30 hover:bg-card/90"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
