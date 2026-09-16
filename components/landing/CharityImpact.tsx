import Link from "next/link"
import { ArrowRight, CheckCircle2, HeartHandshake, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function CharityImpact() {
  const impactTiers = [
    {
      percentage: "10%",
      label: "Guaranteed Base",
      description: "Included standard with every single ScoreKind membership.",
      selected: false,
    },
    {
      percentage: "15%",
      label: "Popular Member Choice",
      description: "Accelerated funding for local programs and grassroots initiatives.",
      selected: true,
    },
    {
      percentage: "25%+",
      label: "High Impact Champion",
      description: "Maximizes personal philanthropic support with direct progress reporting.",
      selected: false,
    },
  ]

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-background">
      {/* Background subtle radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-center">
          {/* Left Text & Mechanics */}
          <div className="flex w-full flex-col lg:w-1/2">
            <Badge
              variant="secondary"
              className="w-fit mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
            >
              <HeartHandshake className="size-3 text-teal-600 dark:text-teal-400" />
              THE HEART OF SCOREKIND
            </Badge>

            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Every membership{" "}
              <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
                moves something forward.
              </span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Charity is not an afterthought at ScoreKind — it is built directly into
              the foundation. At least 10% of your membership fee is channeled
              directly to a registered cause you choose. You can also voluntarily
              increase your contribution or support partners with standalone gifts.
            </p>

            <div className="mt-8 flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-sm sm:text-base text-foreground font-medium">
                  Direct selection of approved, verified charitable partners
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-sm sm:text-base text-foreground font-medium">
                  Guaranteed minimum 10% allocation with flexible percentage scaling
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="text-sm sm:text-base text-foreground font-medium">
                  Full quarterly remittance statements and transparent impact metrics
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center">
              <Button
                size="lg"
                render={<Link href="/charities" />}
                className="group rounded-xl bg-linear-to-r from-teal-700 to-emerald-600 px-6 text-white shadow-md shadow-teal-700/20 hover:from-teal-800 hover:to-emerald-700"
              >
                <span>Explore Partner Charities</span>
                <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>

          {/* Right Visual Card: Contribution Preview & Impact Metrics */}
          <div className="w-full lg:w-1/2">
            <Card className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-card p-6 sm:p-8 shadow-xl shadow-teal-950/5">
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
                    <HeartHandshake className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Member Contribution Model
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pledge control directly inside your account
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                >
                  Active Pledge
                </Badge>
              </div>

              {/* Contribution percentage slider pills */}
              <div className="mt-6">
                <label className="text-xs font-semibold text-muted-foreground">
                  CHOOSE YOUR ALLOCATION PERCENTAGE
                </label>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {impactTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col rounded-xl border p-3.5 transition-all ${
                        tier.selected
                          ? "border-teal-600 bg-teal-500/10 shadow-sm dark:border-teal-400"
                          : "border-border/60 bg-muted/20 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-foreground">
                          {tier.percentage}
                        </span>
                        {tier.selected && (
                          <span className="size-2 rounded-full bg-teal-600 dark:bg-teal-400" />
                        )}
                      </div>
                      <span className="mt-1 text-[11px] font-bold text-foreground">
                        {tier.label}
                      </span>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Showcase Impact Card */}
              <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Selected Cause Preview:
                  </span>
                  <span className="text-teal-700 dark:text-teal-300 font-medium">
                    Verified 501(c)(3) / Registered Charity
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-800 dark:text-teal-300">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Youth Sports Access Foundation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Providing coaching, equipment, and access for underprivileged youth.
                    </p>
                  </div>
                </div>

                {/* Progress bar demonstration */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Allocation from membership:</span>
                    <span className="font-bold text-teal-700 dark:text-teal-400">15% dedicated</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[60%] rounded-full bg-linear-to-r from-teal-600 to-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-4">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
                  <span>100% of pledged funds remitted</span>
                </div>
                <span>Change cause anytime</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
