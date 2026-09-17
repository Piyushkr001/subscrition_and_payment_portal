import type { Database } from "@/types/database"

export type Score = Database["public"]["Tables"]["scores"]["Row"]
export type ScoreInsert = Database["public"]["Tables"]["scores"]["Insert"]
export type ScoreUpdate = Database["public"]["Tables"]["scores"]["Update"]

export interface ScoreActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface LatestScoresSummary {
  latestScores: Score[]
  allScores: Score[]
  totalCount: number
  isComplete: boolean
  slotsRemaining: number
}
