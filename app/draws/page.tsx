import Link from "next/link"
import { Trophy, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DrawsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
          <span>Monthly Draws & Prize Pools</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          ScoreKind Monthly Draws
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Your golf performance enters you into audited monthly prize draws.
          Enter your 18-hole Stableford scores, match winning draw numbers, and
          win verified cash prizes.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-foreground text-lg">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
            <span>Audited Draw Engine</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Draws take place on the final calendar day of each month. Draw
            entries take an immutable snapshot of your latest active scores and
            subscription status at lock time.
          </p>
        </div>

        <Button
          render={<Link href="/signup" />}
          className="shrink-0 rounded-full px-6 shadow-sm"
        >
          <span>Get Started</span>
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">3-Match Tier</CardTitle>
            <CardDescription className="text-xs">
              Match 3 of 5 draw numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tier 3 prize allocation distributed evenly among all qualifying
              subscribers matching three score numbers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">4-Match Tier</CardTitle>
            <CardDescription className="text-xs">
              Match 4 of 5 draw numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Significant cash prize pool shared between golfers who match four
              of the five drawn numbers.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">5-Match Jackpot</CardTitle>
            <CardDescription className="text-xs">
              Match 5 of 5 draw numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Grand jackpot! If not won, rollover amounts accumulate directly
              into the following month&apos;s prize pool.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
