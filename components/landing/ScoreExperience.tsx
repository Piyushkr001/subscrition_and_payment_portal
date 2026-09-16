import { Calendar, CheckCircle2, Edit3, History, RefreshCw, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function ScoreExperience() {
  const scores = [
    {
      round: "Round 5 (Latest)",
      score: 37,
      date: "14 Sep 2026",
      course: "Wentworth Club",
      status: "Verified",
    },
    {
      round: "Round 4",
      score: 34,
      date: "02 Sep 2026",
      course: "Royal St George's",
      status: "Verified",
    },
    {
      round: "Round 3",
      score: 32,
      date: "24 Aug 2026",
      course: "Sunningdale",
      status: "Verified",
    },
    {
      round: "Round 2",
      score: 29,
      date: "11 Aug 2026",
      course: "Gleneagles",
      status: "Verified",
    },
    {
      round: "Round 1",
      score: 27,
      date: "29 Jul 2026",
      course: "Walton Heath",
      status: "Verified",
    },
  ]

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28 bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row lg:items-center">
          {/* Left Text Column */}
          <div className="flex w-full flex-col lg:w-5/12">
            <Badge
              variant="secondary"
              className="w-fit mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
            >
              <RefreshCw className="size-3 text-teal-600 dark:text-teal-400" />
              DYNAMIC SCORE ENGINE
            </Badge>

            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Your latest five scores.{" "}
              <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
                Always current.
              </span>
            </h2>

            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              ScoreKind uses a rolling 5-score Stableford system. When you complete
              a new round, enter your points (1–45). Your newest score enters the
              window, your oldest automatically retires, and your participation
              remains completely synchronized with your active game.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Standard Stableford Range (1–45 Points)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Universal handicap-adjusted scoring system familiar to golfers worldwide.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <RefreshCw className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Automatic Rolling Window
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Only your 5 most recent rounds qualify for entry, preventing stale participation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-400">
                  <Edit3 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Full Member Control
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Easily review, adjust, and edit your round scores from your member dashboard anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right UI Preview Column */}
          <div className="w-full lg:w-7/12">
            <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-teal-950/5">
              {/* Card Header Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    <History className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Active Stableford Scores
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Qualifying set for upcoming draw
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Current Status: Eligible
                  </Badge>
                </div>
              </div>

              {/* Rolling Scores List */}
              <div className="p-6">
                <div className="flex flex-col gap-3">
                  {scores.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 p-4 transition-all hover:border-teal-500/30 hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500/15 to-emerald-500/10 text-lg font-black text-teal-800 dark:text-teal-300">
                          {item.score}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {item.course}
                            </span>
                            {idx === 0 && (
                              <Badge className="bg-teal-600 text-[10px] text-white hover:bg-teal-700 py-0">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {item.date}
                            </span>
                            <span>·</span>
                            <span>{item.round}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium"
                        >
                          <ShieldCheck className="mr-1 size-3 text-teal-600 dark:text-teal-400" />
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-5" />

                {/* Score Summary Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">5 of 5</span>
                    <span>scores active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Average Stableford:</span>
                    <span className="font-bold text-foreground">31.8 points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Next update:</span>
                    <span className="text-foreground">Upon round submission</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
