"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScoreForm } from "@/components/scores/score-form"
import { updateScore } from "@/lib/scores/actions"
import type { Score } from "@/lib/scores/types"
import type { ScoreFormValues } from "@/lib/validators/score"

interface EditScoreDialogProps {
  score: Score | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditScoreDialog({
  score,
  open,
  onOpenChange,
  onSuccess,
}: EditScoreDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setServerError(null)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (values: ScoreFormValues) => {
    if (!score) return

    setServerError(null)
    setIsSubmitting(true)

    try {
      const result = await updateScore(score.id, values)
      if (!result.success) {
        setServerError(result.error || "Failed to update score.")
        return
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch {
      setServerError("An unexpected network error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!score) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Stableford Round</DialogTitle>
          <DialogDescription className="text-sm">
            Modify the Stableford points or round date for this entry.
          </DialogDescription>
        </DialogHeader>

        <ScoreForm
          key={score.id}
          defaultValues={{
            score: score.score,
            scoreDate: score.score_date,
          }}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          submitLabel="Update Score"
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </DialogContent>
    </Dialog>
  )
}
