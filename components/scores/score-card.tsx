import * as React from "react"
import { Calendar, Target, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Score } from "@/lib/scores/types"

interface ScoreCardProps {
  score: Score
  index: number
  isLatest?: boolean
}

export function formatScoreDate(isoDate: string): string {
  try {
    const [year, month, day] = isoDate.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return isoDate
  }
}

export function ScoreCard({ score, index, isLatest }: ScoreCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
        isLatest
          ? "border-teal-500/40 bg-teal-500/3 dark:bg-teal-500/5 ring-1 ring-teal-500/20"
          : "border-border/70"
      }`}
    >
      <div className="absolute top-0 right-0 h-16 w-16 overflow-hidden pointer-events-none">
        <div
          className={`absolute transform rotate-45 text-center text-[10px] font-bold py-0.5 -right-8.75 top-4.5 w-30 ${
            isLatest
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-muted text-muted-foreground"
          }`}
        >
          #{index + 1} Round
        </div>
      </div>

      <CardContent className="p-5 flex flex-col justify-between space-y-4">
        <div className="flex items-center gap-2">
          {isLatest ? (
            <Badge
              variant="outline"
              className="gap-1 border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-semibold"
            >
              <Award className="size-3 text-teal-600 dark:text-teal-400" />
              Newest Round
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[11px] font-medium text-muted-foreground">
              Round {index + 1} of 5
            </Badge>
          )}
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-4xl font-extrabold tracking-tight text-foreground flex items-baseline gap-1.5">
              <span>{score.score}</span>
              <span className="text-sm font-medium text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Stableford Score</p>
          </div>

          <div className="flex size-11 items-center justify-center rounded-xl bg-muted/60 text-primary">
            <Target className="size-5" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/40">
          <Calendar className="size-3.5 text-muted-foreground/80" />
          <span className="font-medium text-foreground">{formatScoreDate(score.score_date)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
