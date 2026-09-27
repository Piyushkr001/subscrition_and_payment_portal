import type { Metadata } from "next"
import Link from "next/link"
import { HeartHandshake, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getActiveCharities } from "@/lib/charities/queries"
import { CharityDirectory } from "@/components/charities/charity-directory"

export const metadata: Metadata = {
  title: "Partner Charities | ScoreKind",
  description:
    "Explore ScoreKind's verified charitable partners. At least 10% of every membership is allocated to support youth athletics, cancer research, veterans, and environmental conservation.",
}

export default async function CharitiesPage() {
  const charities = await getActiveCharities()

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
          <HeartHandshake className="size-4 text-teal-600 dark:text-teal-400" />
          <span>Committed 10%+ Impact</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
          Partner Charities
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg leading-relaxed">
          With ScoreKind, playing golf creates lasting philanthropic impact. A minimum
          of 10% of every membership subscription is allocated toward the accredited
          charity partner you nominate.
        </p>
      </div>

      {/* Trust & Allocation Banner */}
      <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-lg">
            <ShieldCheck className="size-5 text-teal-600 dark:text-teal-400" />
            <span>Accredited & Verified Causes</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Every listed partner charity is verified by our compliance team. Subscribers can
            customize their allocation percentage from 10% up to 100% anytime inside their
            member dashboard.
          </p>
        </div>

        <Button
          render={<Link href="/signup" />}
          className="shrink-0 rounded-full px-6 shadow-sm bg-teal-700 hover:bg-teal-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700"
        >
          <span>Join ScoreKind</span>
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>

      {/* Real Active Charities Directory */}
      <CharityDirectory charities={charities} />
    </div>
  )
}
