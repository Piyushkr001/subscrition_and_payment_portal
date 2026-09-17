import { z } from "zod"

/**
 * Score Validation Schema
 *
 * Rules:
 * 1. Score must be an integer between 1 and 45 inclusive (Stableford scoring system).
 * 2. scoreDate must be a valid ISO date string (YYYY-MM-DD).
 * 3. scoreDate cannot be in the future (golf rounds must have already taken place).
 */

function getTodayIsoString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const scoreSchema = z.object({
  score: z.coerce
    .number({
      error: "Score is required and must be a number",
    })
    .int("Score must be a whole number")
    .min(1, "Score must be at least 1 point")
    .max(45, "Score cannot exceed 45 points (maximum Stableford round)"),
  scoreDate: z
    .string()
    .min(1, "Date of round is required")
    .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Please select a valid date (YYYY-MM-DD)",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Please enter a valid calendar date",
    })
    .refine((val) => val <= getTodayIsoString(), {
      message: "Round date cannot be in the future. Enter today or a past date.",
    }),
})

export type ScoreInput = z.infer<typeof scoreSchema>
export type ScoreFormValues = ScoreInput
