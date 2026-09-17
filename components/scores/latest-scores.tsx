import * as React from "react"
import { Plus, CheckCircle2, CircleDashed } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScoreCard } from "@/components/scores/score-card"
import type { Score } from "@/lib/scores/types"

interface LatestScoresProps {
  scores: Score[]
  onAddScore: () => void
}

export function LatestScores({ scores, onAddScore }: LatestScoresProps) {
  const count = scores.length
  const isComplete = count >= 5
  const remaining = Math.max(0, 5 - count)

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Latest 5 Stableford Scores
            </h2>
            {isComplete ? (
              <Badge className="gap-1 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                Score set complete (5/5)
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10">
                <CircleDashed className="size-3 text-amber-600 dark:text-amber-400" />
                {count} of 5 scores recorded
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isComplete
              ? "Your active rolling five rounds are up to date and sorted newest first."
              : `Add ${remaining} more round${remaining > 1 ? "s" : ""} to complete your active rolling-five scoring set.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Render filled scores */}
        {scores.map((score, index) => (
          <ScoreCard
            key={score.id}
            score={score}
            index={index}
            isLatest={index === 0}
          />
        ))}

        {/* Render empty slots if fewer than 5 exist */}
        {Array.from({ length: remaining }).map((_, i) => {
          const slotNumber = count + i + 1
          return (
            <button
              key={`empty-slot-${i}`}
              type="button"
              onClick={onAddScore}
              className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-center transition-all hover:border-primary/50 hover:bg-muted/40 group"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="size-5" />
              </div>
              <span className="mt-2 text-xs font-semibold text-foreground">
                Slot #{slotNumber}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                Click to add round
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
