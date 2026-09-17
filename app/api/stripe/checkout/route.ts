import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStripe } from "@/lib/stripe/client"
import { getPlanConfig, type PlanId } from "@/lib/stripe/config"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to proceed to checkout." },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const planId = body.plan as PlanId

    const planConfig = getPlanConfig(planId)
    if (!planConfig) {
      return NextResponse.json(
        { error: "Invalid membership plan selected. Please choose 'monthly' or 'yearly'." },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const supabaseAdmin = createAdminClient()

    // 1. Check if user already has an existing provider_customer_id
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("user_id", user.id)
      .not("provider_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let customerId = existingSub?.provider_customer_id

    // 2. If no customer ID exists, create one in Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id
    }

    // 3. Resolve origin for safe callback redirects
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"

    // 4. Construct line items (use pre-created price ID if available, else dynamic recurring price_data)
    const lineItems = planConfig.stripePriceId
      ? [
          {
            price: planConfig.stripePriceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: planConfig.currency,
              unit_amount: planConfig.priceAmount * 100, // Stripe expects amount in smallest currency unit (e.g. paise / cents)
              recurring: {
                interval: planConfig.interval,
              },
              product_data: {
                name: `ScoreKind ${planConfig.name}`,
                description: planConfig.description,
              },
            },
            quantity: 1,
          },
        ]

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${origin}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        userId: user.id,
        plan: planConfig.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: planConfig.id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to generate Stripe checkout session URL." },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    console.error("[Stripe Checkout Error]:", error)
    const message =
      error instanceof Error ? error.message : "Failed to initiate checkout session."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
