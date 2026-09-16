import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "./get-current-user"
import type { Profile } from "@/types"

/**
 * Retrieves the current user's trusted profile and role from the database.
 * The role in the profile is protected by RLS and database triggers.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error || !profile) {
      return null
    }

    return profile
  } catch {
    return null
  }
}
