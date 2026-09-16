import { redirect } from "next/navigation"
import { getCurrentUser } from "./get-current-user"
import { getCurrentProfile } from "./get-current-profile"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

/**
 * Ensures an authenticated user exists on the server.
 * If unauthenticated, immediately redirects to /login.
 */
export async function requireUser(
  redirectTo = "/login"
): Promise<{ user: User; profile: Profile | null }> {
  const user = await getCurrentUser()

  if (!user) {
    redirect(redirectTo)
  }

  const profile = await getCurrentProfile()

  return { user, profile }
}
