"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { scoreSchema, type ScoreInput } from "@/lib/validators/score"
import { canManageScores } from "@/lib/scores/subscription-check"
import type { Score, ScoreActionResult } from "@/lib/scores/types"

/**
 * Helper to get authenticated user and enforce score management permissions.
 */
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Authentication required. Please sign in to continue.")
  }

  const access = await canManageScores(user.id)
  if (!access.allowed) {
    throw new Error(access.reason || "Score management is not available.")
  }

  return { supabase, user }
}

/**
 * Fetch all scores for the authenticated user, newest rounds first.
 */
export async function getScores(): Promise<Score[]> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })

    if (error) {
      console.error("Error fetching scores:", error.message)
      return []
    }

    return (data as Score[]) || []
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw err
    }
    console.error("Error in getScores:", err)
    return []
  }
}

/**
 * Fetch the latest 5 scores for the authenticated user.
 * Derived dynamically via ORDER BY score_date DESC LIMIT 5.
 * Never deletes or affects historical scores.
 */
export async function getLatestScores(limit: number = 5): Promise<Score[]> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching latest scores:", error.message)
      return []
    }

    return (data as Score[]) || []
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err && (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw err
    }
    console.error("Error in getLatestScores:", err)
    return []
  }
}

/**
 * Create a new Stableford score entry for the authenticated user.
 * Derives user_id strictly from the session token.
 */
export async function createScore(
  input: ScoreInput
): Promise<ScoreActionResult<Score>> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    // 1. Validate input bounds & format with Zod
    const parsed = scoreSchema.safeParse(input)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid score data"
      return { success: false, error: firstError }
    }

    const { score, scoreDate } = parsed.data

    // 2. Pre-check for duplicate round date for this user
    const { data: existingDateScore } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("score_date", scoreDate)
      .maybeSingle()

    if (existingDateScore) {
      return {
        success: false,
        error:
          "You already have a score for this date. Edit the existing entry instead.",
      }
    }

    // 3. Insert score strictly using verified user.id
    const { data: newScore, error: insertError } = await supabase
      .from("scores")
      .insert({
        user_id: user.id,
        score,
        score_date: scoreDate,
      })
      .select()
      .single()

    if (insertError) {
      // Catch duplicate constraint in case of race conditions
      if (insertError.code === "23505") {
        return {
          success: false,
          error:
            "You already have a score for this date. Edit the existing entry instead.",
        }
      }
      return {
        success: false,
        error: "Failed to record score. Please try again.",
      }
    }

    revalidatePath("/dashboard/scores")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: newScore as Score,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}

/**
 * Update an existing Stableford score entry.
 * Enforces ownership and checks for duplicate dates.
 */
export async function updateScore(
  scoreId: string,
  input: ScoreInput
): Promise<ScoreActionResult<Score>> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    if (!scoreId) {
      return { success: false, error: "Score ID is required." }
    }

    // 1. Validate input
    const parsed = scoreSchema.safeParse(input)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid score data"
      return { success: false, error: firstError }
    }

    const { score, scoreDate } = parsed.data

    // 2. Check collision with any OTHER score for this user on the new date
    const { data: duplicateDateScore } = await supabase
      .from("scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("score_date", scoreDate)
      .neq("id", scoreId)
      .maybeSingle()

    if (duplicateDateScore) {
      return {
        success: false,
        error:
          "You already have a score recorded for this date. Please choose another date or edit that entry.",
      }
    }

    // 3. Update score ensuring RLS / user_id matches
    const { data: updatedScore, error: updateError } = await supabase
      .from("scores")
      .update({
        score,
        score_date: scoreDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scoreId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          success: false,
          error: "You already have a score for this date.",
        }
      }
      return {
        success: false,
        error: "Failed to update score. Please try again.",
      }
    }

    revalidatePath("/dashboard/scores")
    revalidatePath("/dashboard")

    return {
      success: true,
      data: updatedScore as Score,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}

/**
 * Delete a score entry.
 * Enforces ownership through both server verification and RLS.
 */
export async function deleteScore(
  scoreId: string
): Promise<ScoreActionResult<void>> {
  try {
    const { supabase, user } = await getAuthenticatedUser()

    if (!scoreId) {
      return { success: false, error: "Score ID is required." }
    }

    const { error: deleteError } = await supabase
      .from("scores")
      .delete()
      .eq("id", scoreId)
      .eq("user_id", user.id)

    if (deleteError) {
      return {
        success: false,
        error: "Failed to delete score. Please try again.",
      }
    }

    revalidatePath("/dashboard/scores")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred."
    return { success: false, error: message }
  }
}
