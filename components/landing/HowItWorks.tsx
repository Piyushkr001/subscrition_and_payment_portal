import { CheckCircle, CreditCard, HeartHandshake, ListOrdered, Sparkles, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: CreditCard,
      title: "Subscribe",
      badge: "Flexibility",
      description:
        "Select an affordable monthly or annual membership. Cancel or pause anytime directly from your member dashboard.",
    },
    {
      step: "02",
      icon: ListOrdered,
      title: "Track Your Scores",
      badge: "Performance",
      description:
        "Log your latest 5 Stableford scores (range 1–45). As you play fresh rounds, your rolling window automatically updates.",
    },
    {
      step: "03",
      icon: HeartHandshake,
      title: "Support a Cause",
      badge: "10%+ Giving",
      description:
        "Choose an authorized charitable cause and allocate at least 10% (or more) of your membership fee directly toward their mission.",
    },
    {
      step: "04",
      icon: Trophy,
      title: "Enter Monthly Draws",
      badge: "Reward Tiers",
      description:
        "Your active 5-score set is automatically entered into monthly draws. Match 3, 4, or 5 numbers for community prize pools.",
    },
  ]

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-28 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <Sparkles className="size-3 text-teal-600 dark:text-teal-400" />
            HOW IT WORKS
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            One membership.{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              Three ways to make it count.
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A transparent and rewarding experience designed around sportsmanship,
            accountability, and collective philanthropic impact.
          </p>
        </div>

        {/* 4 Steps Grid using Flexbox */}
        <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:flex-wrap">
          {steps.map((item, idx) => {
            const Icon = item.icon
            return (
              <Card
                key={idx}
                className="group relative flex-1 min-w-65 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-950/5 dark:hover:shadow-none"
              >
                {/* Subtle top indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-teal-600/0 via-teal-600/40 to-emerald-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-black text-muted/80 group-hover:text-teal-600/40 dark:text-muted-foreground/30 transition-colors">
                    {item.step}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-border text-[11px] font-medium text-muted-foreground"
                  >
                    {item.badge}
                  </Badge>
                </div>

                <div className="mt-6 flex size-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:text-teal-400">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            )
          })}
        </div>

        {/* Micro reassurance under steps */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-border/50 bg-muted/20 px-6 py-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-teal-600 dark:text-teal-400" />
            <span>Official Stableford score calculation</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-teal-600 dark:text-teal-400" />
            <span>Audited & verified monthly draw mechanics</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-teal-600 dark:text-teal-400" />
            <span>Guaranteed charity remittance with reporting</span>
          </div>
        </div>
      </div>
    </section>
  )
}
