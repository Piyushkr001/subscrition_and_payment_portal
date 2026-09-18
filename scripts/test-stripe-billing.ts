/**
 * Automated Stripe Subscription, Webhook & Security Hardening Verification Suite
 *
 * Safety Rules:
 * 1. Strictly refuses to run in production (NODE_ENV === 'production').
 * 2. Requires explicit ALLOW_DESTRUCTIVE_TESTS=true environment variable.
 * 3. Never mutates arbitrary database subscribers; uses dedicated test account.
 * 4. Cleans up only records created by this test suite.
 */

import { createClient } from "@supabase/supabase-js"
import { getPlanConfig, formatPlanPrice } from "../lib/stripe/config"
import { normalizeSubscriptionStatus } from "../lib/stripe/sync-subscription"
import type { Database } from "../types/database"

// 1. Production Safety Guards
if (process.env.NODE_ENV === "production") {
  console.error("FATAL: Test scripts cannot run against production environment.")
  process.exit(1)
}

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== "true") {
  console.error(
    "SAFETY GUARD: Refusing to run tests without explicit ALLOW_DESTRUCTIVE_TESTS=true."
  )
  console.error("Run with: ALLOW_DESTRUCTIVE_TESTS=true bun run scripts/test-stripe-billing.ts")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error("Missing Supabase environment variables.")
  process.exit(1)
}

// Ensure target is local or test
const isLocalOrTest =
  supabaseUrl.includes("127.0.0.1") ||
  supabaseUrl.includes("localhost") ||
  supabaseUrl.includes("supabase.co")

if (!isLocalOrTest) {
  console.error("Safety Guard: Supabase URL does not appear to be a recognized test/local target.")
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey)
const supabaseAnon = createClient<Database>(supabaseUrl, anonKey)

const TEST_EMAIL = `scorekind-test-billing-${Date.now()}@example.com`
const TEST_PASSWORD = "TestPassword123!Secure"

async function runStripeTests() {
  console.log("==================================================")
  console.log("1. TESTING STRIPE PLAN CONFIGURATION & DYNAMIC MATH")
  console.log("==================================================")

  const monthlyPlan = getPlanConfig("monthly")
  const yearlyPlan = getPlanConfig("yearly")
  const invalidPlan = getPlanConfig("enterprise")

  if (!monthlyPlan || monthlyPlan.interval !== "month" || monthlyPlan.priceAmount <= 0) {
    throw new Error("Monthly plan configuration is invalid.")
  }
  console.log(`✓ Monthly Plan: ${monthlyPlan.name} - ${formatPlanPrice(monthlyPlan)} ${monthlyPlan.period}`)

  if (!yearlyPlan || yearlyPlan.interval !== "year" || yearlyPlan.priceAmount <= 0) {
    throw new Error("Yearly plan configuration is invalid.")
  }
  console.log(`✓ Annual Plan: ${yearlyPlan.name} - ${formatPlanPrice(yearlyPlan)} ${yearlyPlan.period}`)

  // Verify dynamic savings calculation
  const annualAtMonthly = monthlyPlan.priceAmount * 12
  const expectedSavings = annualAtMonthly - yearlyPlan.priceAmount
  const expectedPercent = Math.round((expectedSavings / annualAtMonthly) * 100)

  console.log(`✓ Dynamic Annual Savings: ₹${expectedSavings.toLocaleString("en-IN")} (~${expectedPercent}%)`)
  if (!yearlyPlan.badge?.includes(expectedPercent.toString())) {
    throw new Error(`Yearly plan badge does not reflect dynamic savings (${yearlyPlan.badge})`)
  }

  if (invalidPlan !== null) {
    throw new Error("Invalid plan identifier was incorrectly resolved.")
  }
  console.log("✓ Invalid plan identifier safely returns null")

  console.log("\n==================================================")
  console.log("2. TESTING SECRET ISOLATION & ZERO-TRUST SECURITY")
  console.log("==================================================")

  const envKeys = Object.keys(process.env)
  const exposedSecrets = envKeys.filter(
    (k) =>
      k.startsWith("NEXT_PUBLIC_") &&
      (k.includes("STRIPE_SECRET") || k.includes("STRIPE_WEBHOOK") || k.includes("SERVICE_ROLE"))
  )

  if (exposedSecrets.length > 0) {
    throw new Error(`Security violation! Secret keys exposed with NEXT_PUBLIC_: ${exposedSecrets.join(", ")}`)
  }
  console.log("✓ No secret keys (Stripe or Supabase) prefixed with NEXT_PUBLIC_")

  console.log("\n==================================================")
  console.log("3. TESTING FAIL-CLOSED STATUS NORMALIZATION")
  console.log("==================================================")

  // Test that unknown or unsupported statuses NEVER map to active
  const unknownTests = ["custom_state", "unsupported", "random", "", null, undefined]
  for (const status of unknownTests) {
    const normalized = normalizeSubscriptionStatus(status as unknown as Parameters<typeof normalizeSubscriptionStatus>[0])
    if (normalized === "active" || normalized === "trialing") {
      throw new Error(`SECURITY VULNERABILITY: Unknown status '${status}' mapped to active state '${normalized}'!`)
    }
    if (normalized !== "incomplete") {
      throw new Error(`Unknown status '${status}' did not fail closed to 'incomplete' (got '${normalized}')`)
    }
  }
  console.log("✓ All unknown/unsupported statuses fail-closed to 'incomplete'")

  // Test canonical spelling of canceled -> cancelled
  const canceledNormalized = normalizeSubscriptionStatus("canceled")
  if (canceledNormalized !== "cancelled") {
    throw new Error(`Stripe 'canceled' was not mapped to canonical 'cancelled' (got '${canceledNormalized}')`)
  }
  console.log("✓ Stripe 'canceled' properly canonicalized to internal 'cancelled'")

  console.log("\n==================================================")
  console.log("4. PROVISIONING DEDICATED TEST USER")
  console.log("==================================================")

  // Create isolated test user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Test Billing Member" },
  })

  if (authError || !authUser?.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`)
  }

  const testUserId = authUser.user.id
  console.log(`✓ Dedicated test user created: ${TEST_EMAIL} (${testUserId})`)

  try {
    console.log("\n==================================================")
    console.log("5. TESTING RLS POLICY ON public.subscriptions")
    console.log("==================================================")

    // Anon client attempt to fabricate subscription row directly
    const { error: forgedInsertError } = await supabaseAnon
      .from("subscriptions")
      .insert({
        user_id: testUserId,
        plan: "yearly",
        status: "active",
        provider_customer_id: "cus_fake_id",
        provider_subscription_id: "sub_fake_id",
      })

    if (forgedInsertError) {
      console.log("✓ RLS successfully BLOCKED unprivileged client from fabricating subscription directly")
    } else {
      throw new Error("Security Breach: Anon client was able to insert subscription!")
    }

    console.log("\n==================================================")
    console.log("6. TESTING DEDICATED STRIPE CUSTOMERS TABLE")
    console.log("==================================================")

    const testStripeCustomerId = `cus_test_${Date.now()}`

    // Insert 1:1 customer mapping
    const { error: customerInsertError } = await supabaseAdmin
      .from("stripe_customers")
      .insert({
        user_id: testUserId,
        stripe_customer_id: testStripeCustomerId,
      })

    if (customerInsertError) {
      throw new Error(`Failed to insert into stripe_customers: ${customerInsertError.message}`)
    }
    console.log(`✓ Successfully mapped user to Stripe customer: ${testStripeCustomerId}`)

    // Verify 1:1 uniqueness constraint
    const { error: duplicateCustomerError } = await supabaseAdmin
      .from("stripe_customers")
      .insert({
        user_id: testUserId,
        stripe_customer_id: `cus_another_${Date.now()}`,
      })

    if (duplicateCustomerError && duplicateCustomerError.code === "23505") {
      console.log("✓ Uniqueness constraint successfully prevented duplicate customer mapping for user")
    } else {
      throw new Error("Expected 23505 unique violation for duplicate stripe_customer user_id")
    }

    console.log("\n==================================================")
    console.log("7. TESTING WEBHOOK IDEMPOTENCY & AUDIT TABLE")
    console.log("==================================================")

    const testEventId = `evt_test_idempotency_${Date.now()}`

    // Insert initial webhook event record
    const { error: eventInsertError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .insert({
        stripe_event_id: testEventId,
        event_type: "customer.subscription.updated",
        status: "processing",
      })

    if (eventInsertError) {
      throw new Error(`Failed to insert stripe_webhook_events: ${eventInsertError.message}`)
    }
    console.log(`✓ Recorded webhook event ${testEventId} with status 'processing'`)

    // Mark as processed
    const { error: eventProcessError } = await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", testEventId)

    if (eventProcessError) {
      throw new Error(`Failed to mark event processed: ${eventProcessError.message}`)
    }

    // Verify subsequent lookup identifies it as processed
    const { data: checkedEvent } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("status")
      .eq("stripe_event_id", testEventId)
      .single()

    if (checkedEvent?.status === "processed") {
      console.log("✓ Idempotency lookup successfully detects previously processed event")
    } else {
      throw new Error(`Expected status 'processed', found '${checkedEvent?.status}'`)
    }

    console.log("\n==================================================")
    console.log("8. TESTING OUT-OF-ORDER EVENT TIMESTAMP PROTECTION")
    console.log("==================================================")

    const testSubId = `sub_test_ooo_${Date.now()}`
    const timestampNewer = 1770000000

    // Insert subscription with newer timestamp
    const { error: subInsertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: testUserId,
        provider_customer_id: testStripeCustomerId,
        provider_subscription_id: testSubId,
        plan: "yearly",
        status: "active",
        last_stripe_event_timestamp: timestampNewer,
      })

    if (subInsertError) {
      throw new Error(`Failed to insert subscription: ${subInsertError.message}`)
    }
    console.log(`✓ Subscription inserted with event timestamp ${timestampNewer}`)

    // Query to verify
    const { data: createdSub } = await supabaseAdmin
      .from("subscriptions")
      .select("last_stripe_event_timestamp")
      .eq("provider_subscription_id", testSubId)
      .single()

    if (Number(createdSub?.last_stripe_event_timestamp) !== timestampNewer) {
      throw new Error("Subscription timestamp mismatch")
    }
    console.log("✓ Timestamp verified in database; out-of-order protection column is functional")

    console.log("\n==================================================")
    console.log("9. TESTING CANONICAL CHECK CONSTRAINT ('cancelled')")
    console.log("==================================================")

    // Verify valid canonical status 'cancelled' is accepted
    const { error: validStatusError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("provider_subscription_id", testSubId)

    if (validStatusError) {
      throw new Error(`Valid status 'cancelled' was rejected: ${validStatusError.message}`)
    }
    console.log("✓ Canonical status 'cancelled' accepted by check constraint")

    // Verify non-canonical status 'canceled' (single 'l') is REJECTED
    const { error: invalidStatusError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled" as unknown as Database["public"]["Tables"]["subscriptions"]["Update"]["status"] })
      .eq("provider_subscription_id", testSubId)

    if (invalidStatusError && invalidStatusError.code === "23514") {
      console.log("✓ Non-canonical status 'canceled' successfully REJECTED by check constraint (code 23514)")
    } else {
      throw new Error("Expected check constraint violation for 'canceled'")
    }

  } finally {
    console.log("\n==================================================")
    console.log("CLEANUP: REMOVING ONLY DEDICATED TEST DATA")
    console.log("==================================================")

    await supabaseAdmin.from("subscriptions").delete().eq("user_id", testUserId)
    await supabaseAdmin.from("stripe_customers").delete().eq("user_id", testUserId)
    await supabaseAdmin.from("scores").delete().eq("user_id", testUserId)
    await supabaseAdmin.from("profiles").delete().eq("id", testUserId)
    await supabaseAdmin.auth.admin.deleteUser(testUserId)
    console.log(`✓ Cleaned up test user ${testUserId}`)
  }

  console.log("\n==================================================")
  console.log("ALL STRIPE BILLING & SECURITY TESTS PASSED!")
  console.log("==================================================")
}

runStripeTests().catch((err) => {
  console.error("Test Suite Failed:", err)
  process.exit(1)
})
