import Link from "next/link"
import { ArrowUpRight, Compass, Leaf, Shield, Sparkles, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function CharitySpotlight() {
  const causes = [
    {
      name: "Grassroots Youth Sports Trust",
      category: "Youth & Inclusion",
      icon: Trophy,
      tagline: "Unlocking junior golf and team athletics for underserved communities.",
      impact: "Equipment grants, junior memberships & qualified coaching clinics.",
      status: "Partner Cause",
    },
    {
      name: "Open Fairways Conservation",
      category: "Environment & Habitat",
      icon: Leaf,
      tagline: "Restoring natural ecosystems, water conservation & biodiversity across green spaces.",
      impact: "Tree planting, wildlife corridors & clean water preservation projects.",
      status: "Partner Cause",
    },
    {
      name: "Veterans Adaptive Sports League",
      category: "Health & Rehabilitation",
      icon: Shield,
      tagline: "Providing adaptive recreational sports and camaraderie programs for injured veterans.",
      impact: "Rehabilitative sport programs, community clinics & peer mentoring.",
      status: "Partner Cause",
    },
  ]

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <Compass className="size-3 text-teal-600 dark:text-teal-400" />
            FEATURED PARTNERS
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Causes worth{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              playing for.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Choose from a growing directory of registered non-profits, or request to
            add a registered charity close to your heart.
          </p>
        </div>

        {/* 3 Charity Cards using Flexbox with Wrap */}
        <div className="mt-14 flex flex-col gap-6 md:flex-row md:flex-wrap">
          {causes.map((cause, idx) => {
            const Icon = cause.icon
            return (
              <Card
                key={idx}
                className="group flex flex-1 min-w-70 flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-950/5 dark:hover:shadow-none"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-border text-xs text-muted-foreground"
                    >
                      {cause.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-400">
                      <Sparkles className="size-3" />
                      <span>{cause.status}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex size-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:text-teal-400">
                    <Icon className="size-6" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-foreground">
                    {cause.name}
                  </h3>

                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {cause.tagline}
                  </p>

                  <div className="mt-5 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs">
                    <span className="font-semibold text-foreground">Focus Area: </span>
                    <span className="text-muted-foreground">{cause.impact}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-border/50 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/charities" />}
                    className="w-full justify-between rounded-xl px-3 font-semibold text-teal-700 hover:bg-teal-500/10 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                  >
                    <span>View Cause Details</span>
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Action button */}
        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            render={<Link href="/charities" />}
            className="rounded-xl border-border px-8 font-medium hover:bg-muted"
          >
            Explore All Registered Charities
          </Button>
        </div>
      </div>
    </section>
  )
}
