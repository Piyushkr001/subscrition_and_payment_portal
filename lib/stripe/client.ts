import Stripe from "stripe"

let stripeClient: Stripe | null = null

/**
 * Server-only Stripe client singleton.
 * NEVER import or invoke this function in client components.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in environment variables. Please check your .env file."
    )
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-08-26.dahlia" as unknown as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: "ScoreKind",
        version: "1.0.0",
      },
    })
  }

  return stripeClient
}
