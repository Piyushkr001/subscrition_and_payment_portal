import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Ensure Google OAuth logins always route to subscriber dashboard
      // Google Login is strictly for normal users, not for Admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile?.role === "admin" && data.user.app_metadata?.provider === "google") {
        // Admin accounts must authenticate with credentials, not Google OAuth
        return NextResponse.redirect(
          new URL(
            "/login?error=Administrators%20must%20sign%20in%20with%20their%20admin%20credentials",
            requestUrl.origin
          )
        )
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // If error or code missing, return user to login with error
  return NextResponse.redirect(
    new URL("/login?error=Could%20not%20authenticate%20user", requestUrl.origin)
  )
}
