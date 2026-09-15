import { Award, CheckCircle2, HeartHandshake, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function BenefitsSection() {
  const benefits = [
    {
      icon: Sparkles,
      title: "Play With Purpose",
      description:
        "Transform routine Stableford golf rounds into regular support for causes that create real-world opportunities.",
    },
    {
      icon: ShieldCheck,
      title: "Transparent Draws",
      description:
        "Audited 3-tier mechanics with automated rollover. Zero casino gimmicks, just fair member participation.",
    },
    {
      icon: HeartHandshake,
      title: "Choose Your Cause",
      description:
        "Select your preferred non-profit, adjust your pledge level anytime, and track direct remittances quarterly.",
    },
    {
      icon: LayoutDashboard,
      title: "Track Everything",
      description:
        "One centralized member hub for your 5 latest scores, draw eligibility, prize history, and charitable impact.",
    },
  ]

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <Award className="size-3 text-teal-600 dark:text-teal-400" />
            THE SCOREKIND DIFFERENCE
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Why members choose{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              ScoreKind.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            We built ScoreKind to replace traditional, solitary lottery games with a
            modern sportsmanship collective that combines passion with genuine philanthropy.
          </p>
        </div>

        {/* Benefits Grid using Flexbox */}
        <div className="mt-14 flex flex-col gap-6 sm:flex-row sm:flex-wrap">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <Card
                key={idx}
                className="group flex flex-1 min-w-65 flex-col rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:border-teal-500/40 hover:bg-card/90 hover:shadow-md dark:hover:shadow-none"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:text-teal-400">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {benefit.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
