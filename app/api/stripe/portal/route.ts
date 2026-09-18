import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStripe } from "@/lib/stripe/client"
import { getAppUrl } from "@/lib/stripe/config"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to access the billing portal." },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Look up trusted stripe_customer_id from dedicated mapping table
    const { data: customerRow } = await supabaseAdmin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()

    let customerId = customerRow?.stripe_customer_id

    // Fallback: Check historical subscriptions table
    if (!customerId) {
      const { data: subscription } = await supabaseAdmin
        .from("subscriptions")
        .select("provider_customer_id")
        .eq("user_id", user.id)
        .not("provider_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      customerId = subscription?.provider_customer_id
    }

    if (!customerId) {
      return NextResponse.json(
        {
          error:
            "No active Stripe billing customer found for your account. Please subscribe to a membership first.",
        },
        { status: 404 }
      )
    }

    const stripe = getStripe()
    const appUrl = getAppUrl()

    // 2. Create Stripe Customer Portal session with trusted return URL
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url }, { status: 200 })
  } catch (error) {
    console.error("[Stripe Portal Error]:", error)
    const message =
      error instanceof Error ? error.message : "Failed to generate billing portal session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
