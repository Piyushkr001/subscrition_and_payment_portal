import { redirect } from "next/navigation"
import { requireUser } from "./require-user"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

/**
 * Server-side authorization guard requiring administrator privileges.
 * Verifies authenticated session AND checks trusted profile.role in the database.
 * Never trusts client-side role assertions or unverified JWT claims.
 */
export async function requireAdmin(): Promise<{
  user: User
  profile: Profile
}> {
  const { user, profile } = await requireUser("/login")

  if (!profile || profile.role !== "admin") {
    // Non-admin authenticated users are rejected from /admin routes
    redirect("/dashboard")
  }

  return { user, profile }
}
