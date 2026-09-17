import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSafeInternalRedirect } from "@/lib/auth/safe-redirect"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const rawNext = requestUrl.searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Query profile role to determine safe default destination
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle()

      const defaultRedirect = profile?.role === "admin" ? "/admin" : "/dashboard"
      const safePath = getSafeInternalRedirect(rawNext, defaultRedirect)

      return NextResponse.redirect(new URL(safePath, requestUrl.origin))
    }
  }

  // If error or code missing, return user to login with error
  return NextResponse.redirect(
    new URL("/login?error=Could%20not%20authenticate%20user", requestUrl.origin)
  )
}
