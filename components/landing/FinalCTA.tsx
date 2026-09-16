import Link from "next/link"
import { ArrowRight, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 bg-background">
      {/* Background Decorative Gradient Radiance */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 justify-center overflow-hidden"
      >
        <div className="h-112 w-216 rounded-full bg-linear-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-teal-500/30 bg-linear-to-b from-card via-card to-teal-500/5 p-8 text-center shadow-2xl shadow-teal-950/5 sm:p-12 lg:p-16">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <HeartHandshake className="size-3.5 text-teal-600 dark:text-teal-400" />
            <span>JOIN THE SCOREKIND COLLECTIVE</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-6xl">
            Play for more than{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              the score.
            </span>
          </h2>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:text-xl">
            Track your golf performance, enter audited monthly prize draws, and help
            fund life-changing causes with at least 10% of your subscription.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              render={<Link href="/signup" />}
              className="group h-12 w-full sm:w-auto rounded-xl bg-linear-to-r from-teal-700 to-emerald-600 px-8 font-semibold text-white shadow-lg shadow-teal-700/25 transition-all hover:from-teal-800 hover:to-emerald-700 hover:shadow-xl"
            >
              <span>Join ScoreKind</span>
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              render={<Link href="/charities" />}
              className="h-12 w-full sm:w-auto rounded-xl border-border px-8 font-medium hover:bg-muted"
            >
              Explore Charities
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Monthly or yearly membership · Minimum 10% pledged · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
