"use client"

import * as React from "react"
import { Target, Plus, Trophy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ScoreEmptyStateProps {
  onAddScore: () => void
}

export function ScoreEmptyState({ onAddScore }: ScoreEmptyStateProps) {
  return (
    <Card className="border-dashed border-border/80 bg-card/50">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-4 ring-teal-500/5">
          <Target className="size-7" />
        </div>
        <CardTitle className="text-xl font-bold">No Stableford scores yet</CardTitle>
        <CardDescription className="max-w-md mx-auto text-sm">
          Track your 18-hole rounds (1 to 45 points). Your latest 5 scores form your active golf snapshot for the monthly verified prize draws.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pb-8 pt-2 space-y-4">
        <Button onClick={onAddScore} className="gap-2 font-medium shadow-sm">
          <Plus className="size-4" />
          Add Your First Score
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full pt-4 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
            <Trophy className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Rolling Five:</span>{" "}
              The 5 most recent rounds are automatically derived by round date.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
            <Sparkles className="size-4 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Permanent History:</span>{" "}
              Older rounds remain securely preserved in your permanent golf logbook.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
