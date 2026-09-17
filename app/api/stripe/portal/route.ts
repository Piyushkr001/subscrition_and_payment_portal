import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to access the billing portal." },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Look up provider_customer_id for this user
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("user_id", user.id)
      .not("provider_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription?.provider_customer_id) {
      return NextResponse.json(
        {
          error:
            "No active Stripe billing customer found. Please subscribe to a membership first.",
        },
        { status: 404 }
      )
    }

    const stripe = getStripe()

    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"

    // 2. Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.provider_customer_id,
      return_url: `${origin}/dashboard/settings`,
    })

    return NextResponse.json({ url: portalSession.url }, { status: 200 })
  } catch (error) {
    console.error("[Stripe Portal Error]:", error)
    const message =
      error instanceof Error ? error.message : "Failed to generate billing portal session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
