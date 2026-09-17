"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { deleteScore } from "@/lib/scores/actions"
import type { Score } from "@/lib/scores/types"

interface DeleteScoreDialogProps {
  score: Score | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteScoreDialog({
  score,
  open,
  onOpenChange,
  onSuccess,
}: DeleteScoreDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleDelete = async () => {
    if (!score) return

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteScore(score.id)
      if (!result.success) {
        setError(result.error || "Failed to delete score.")
        return
      }

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!score) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-4" />
            Delete score?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the{" "}
            <span className="font-semibold text-foreground">
              {score.score} points
            </span>{" "}
            score from {score.score_date} from your golf history. Your rolling-five
            set will automatically recalculate.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="text-xs text-destructive font-medium px-1">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Score"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
