import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getStripe } from "@/lib/stripe/client"
import { getPlanConfig, getAppUrl, type PlanId } from "@/lib/stripe/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUserSubscription } from "@/lib/scores/subscription-check"

export async function POST(request: Request) {
  try {
    // 1. Authenticate user strictly via verified Supabase session
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to proceed to checkout." },
        { status: 401 }
      )
    }

    // 2. Validate requested plan identifier (strictly 'monthly' | 'yearly', reject arbitrary client priceId)
    const body = await request.json().catch(() => ({}))
    const planId = body.plan as PlanId

    if (planId !== "monthly" && planId !== "yearly") {
      return NextResponse.json(
        { error: "Invalid membership plan selected. Please choose 'monthly' or 'yearly'." },
        { status: 400 }
      )
    }

    const planConfig = getPlanConfig(planId)
    if (!planConfig || !planConfig.stripePriceId) {
      console.error(
        `[Stripe Checkout Error]: Missing configured Stripe Price ID for plan '${planId}'.`
      )
      return NextResponse.json(
        {
          error:
            "Subscription configuration error. Required Stripe Price ID is not set on the server.",
        },
        { status: 500 }
      )
    }

    // 3. Duplicate Subscription Prevention: Check user's current subscription status
    const currentSub = await getUserSubscription(user.id)

    if (currentSub?.isActive) {
      return NextResponse.json(
        {
          error:
            "An active subscription already exists for your account. Please manage your existing membership via the Billing Portal.",
          code: "ACTIVE_SUBSCRIPTION_EXISTS",
          portalAvailable: true,
        },
        { status: 409 }
      )
    }

    if (currentSub?.status === "past_due") {
      return NextResponse.json(
        {
          error:
            "Your subscription payment is past due. Please update your payment method in the Billing Portal to reactivate your membership.",
          code: "PAST_DUE_SUBSCRIPTION",
          portalAvailable: !!currentSub.providerCustomerId,
        },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const supabaseAdmin = createAdminClient()

    // 4. Resolve or create 1:1 Stripe Customer mapping (prevents duplicate abandoned customers)
    let customerId: string | null = null

    const { data: customerRow, error: customerQueryError } = await supabaseAdmin
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (customerQueryError) {
      console.error("[Stripe Checkout]: Error querying stripe_customers:", customerQueryError)
      throw customerQueryError
    }

    if (customerRow?.stripe_customer_id) {
      customerId = customerRow.stripe_customer_id
    } else {
      // Create new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      })
      customerId = customer.id

      // Persist mapping immediately into stripe_customers
      const { error: persistCustomerError } = await supabaseAdmin
        .from("stripe_customers")
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
        })

      if (persistCustomerError) {
        console.error(
          "[Stripe Checkout]: Failed to persist stripe_customer mapping for user:",
          persistCustomerError
        )
        throw persistCustomerError
      }
    }

    // 5. Build line items using strictly validated server-side Price ID (no dynamic price_data fallback)
    const lineItems = [
      {
        price: planConfig.stripePriceId,
        quantity: 1,
      },
    ]

    const appUrl = getAppUrl()

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: `${appUrl}/dashboard/billing?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
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
