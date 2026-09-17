"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Info, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LatestScores } from "@/components/scores/latest-scores"
import { ScoreHistory } from "@/components/scores/score-history"
import { ScoreEmptyState } from "@/components/scores/score-empty-state"
import { AddScoreDialog } from "@/components/scores/add-score-dialog"
import { EditScoreDialog } from "@/components/scores/edit-score-dialog"
import { DeleteScoreDialog } from "@/components/scores/delete-score-dialog"
import type { Score } from "@/lib/scores/types"

interface ScoresClientProps {
  initialScores: Score[]
}

export function ScoresClient({ initialScores }: ScoresClientProps) {
  const router = useRouter()

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingScore, setEditingScore] = React.useState<Score | null>(null)
  const [deletingScore, setDeletingScore] = React.useState<Score | null>(null)

  const handleScoreMutated = React.useCallback(() => {
    router.refresh()
  }, [router])

  // Derive latest 5 scores strictly from the date-ordered scores
  const latestFive = React.useMemo(() => {
    return initialScores.slice(0, 5)
  }, [initialScores])

  return (
    <div className="space-y-8">
      {/* 1. Header Bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Scores
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your latest Stableford rounds (1 to 45 points).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 font-semibold shadow-sm"
          >
            <Plus className="size-4" />
            Add Score
          </Button>
        </div>
      </div>

      {/* 2. Main Content: Empty State vs. Active Scores */}
      {initialScores.length === 0 ? (
        <ScoreEmptyState onAddScore={() => setIsAddOpen(true)} />
      ) : (
        <div className="space-y-8">
          {/* Latest 5 Scores Cards */}
          <LatestScores
            scores={latestFive}
            onAddScore={() => setIsAddOpen(true)}
          />

          {/* Explanatory Guide Card */}
          <Card className="border-teal-500/20 bg-teal-500/[0.04] dark:bg-teal-500/[0.06]">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 text-xs">
              <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                <Info className="size-4" />
              </div>
              <div className="space-y-1 text-muted-foreground leading-relaxed">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    How your latest five scores work
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                    <ShieldCheck className="size-3" />
                    Stableford Rules
                  </span>
                </div>
                <p>
                  ScoreKind derives your active golf snapshot from your 5 most
                  recent rounds by date. When you log a newer round, it joins your
                  latest five while previous rounds remain safely archived below.
                  Stableford points range from 1 (minimum) to 45 (maximum standard
                  points).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Complete Score History Table/Cards */}
          <ScoreHistory
            scores={initialScores}
            onEdit={(score) => setEditingScore(score)}
            onDelete={(score) => setDeletingScore(score)}
          />
        </div>
      )}

      {/* 3. Modal Dialogs */}
      <AddScoreDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleScoreMutated}
      />

      <EditScoreDialog
        score={editingScore}
        open={!!editingScore}
        onOpenChange={(open) => !open && setEditingScore(null)}
        onSuccess={handleScoreMutated}
      />

      <DeleteScoreDialog
        score={deletingScore}
        open={!!deletingScore}
        onOpenChange={(open) => !open && setDeletingScore(null)}
        onSuccess={handleScoreMutated}
      />
    </div>
  )
}
