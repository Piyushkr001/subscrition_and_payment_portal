import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"

/**
 * GET /api/me
 * Authenticates the user via Supabase Auth JWT from session cookies,
 * fetches their trusted profile, and returns sanitized profile details.
 */
export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing session" },
      { status: 401 }
    )
  }

  const profile = await getCurrentProfile()

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profile || {
      id: user.id,
      full_name: user.user_metadata?.full_name || null,
      email: user.email || null,
      avatar_url: null,
      role: "subscriber",
    },
  })
}
