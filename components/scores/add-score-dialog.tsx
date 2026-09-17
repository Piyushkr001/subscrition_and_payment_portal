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
import { createScore } from "@/lib/scores/actions"
import type { ScoreFormValues } from "@/lib/validators/score"

interface AddScoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddScoreDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddScoreDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setServerError(null)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (values: ScoreFormValues) => {
    setServerError(null)
    setIsSubmitting(true)

    try {
      const result = await createScore(values)
      if (!result.success) {
        setServerError(result.error || "Failed to record score.")
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Record Stableford Score</DialogTitle>
          <DialogDescription className="text-sm">
            Enter points (1–45) and the round date. Only one round per date is permitted.
          </DialogDescription>
        </DialogHeader>

        <ScoreForm
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          submitLabel="Add Score"
          isSubmitting={isSubmitting}
          serverError={serverError}
        />
      </DialogContent>
    </Dialog>
  )
}
