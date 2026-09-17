"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar as CalendarIcon, Loader2, Target, AlertCircle } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { scoreSchema, type ScoreFormValues } from "@/lib/validators/score"

interface ScoreFormProps {
  defaultValues?: Partial<ScoreFormValues>
  onSubmit: (values: ScoreFormValues) => Promise<void>
  onCancel: () => void
  submitLabel?: string
  isSubmitting?: boolean
  serverError?: string | null
}

function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function ScoreForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save Score",
  isSubmitting = false,
  serverError = null,
}: ScoreFormProps) {
  const today = React.useMemo(() => getTodayString(), [])

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ScoreFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(scoreSchema) as any,
    defaultValues: {
      score: defaultValues?.score ?? 36,
      scoreDate: defaultValues?.scoreDate ?? today,
    },
  })

  const currentScore = useWatch({ control, name: "score" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs font-medium">
            {serverError}
          </AlertDescription>
        </Alert>
      )}

      {/* Score Points Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="score" className="text-sm font-semibold">
            Stableford Score (Points)
          </Label>
          <span className="text-xs text-muted-foreground">Range: 1 – 45</span>
        </div>

        <div className="relative">
          <Input
            id="score"
            type="number"
            min={1}
            max={45}
            step={1}
            disabled={isSubmitting}
            placeholder="e.g. 36"
            className="pl-10 text-lg font-bold tracking-tight"
            aria-invalid={!!errors.score}
            {...register("score", { valueAsNumber: true })}
          />
          <Target className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
        </div>

        {errors.score && (
          <p className="text-xs text-destructive font-medium">
            {errors.score.message}
          </p>
        )}

        {/* Quick presets for common golf Stableford rounds */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground mr-1">Quick Select:</span>
          {[32, 34, 36, 38, 40].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setValue("score", val, { shouldValidate: true })}
              className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                currentScore === val
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {val} pts
            </button>
          ))}
        </div>
      </div>

      {/* Round Date Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="scoreDate" className="text-sm font-semibold">
            Date of Round
          </Label>
          <span className="text-xs text-muted-foreground">Cannot be future</span>
        </div>

        <div className="relative">
          <Input
            id="scoreDate"
            type="date"
            max={today}
            disabled={isSubmitting}
            className="pl-10 font-medium"
            aria-invalid={!!errors.scoreDate}
            {...register("scoreDate")}
          />
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>

        {errors.scoreDate && (
          <p className="text-xs text-destructive font-medium">
            {errors.scoreDate.message}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Only one score entry is permitted per calendar date.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-30">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
