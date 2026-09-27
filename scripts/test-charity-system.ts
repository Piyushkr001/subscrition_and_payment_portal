/**
 * ScoreKind Security & Charity System Verification Suite
 *
 * Covers:
 * 1. Security: has_active_subscription() cross-user privacy enforcement
 * 2. Security: Atomic Stripe webhook event claim & retry idempotency
 * 3. Security & Integrity: RLS policies on charity_preferences & charity_contributions
 * 4. Validation: 9% rejected, 10% accepted, 100% accepted, 101% rejected
 * 5. Calculation: Minor currency integer arithmetic for gross allocation
 * 6. Webhook Idempotency: Duplicate invoice allocations strictly prevented
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"
import { calculateCharityAllocation } from "../lib/charity/calculate-allocation"
import { charityPreferenceSchema } from "../lib/validators/charity"

if (process.env.NODE_ENV === "production") {
  console.error("FATAL: Test scripts cannot run against production environment.")
  process.exit(1)
}

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== "true") {
  console.error("SAFETY GUARD: Refusing to run tests without explicit ALLOW_DESTRUCTIVE_TESTS=true.")
  console.error("Run with: ALLOW_DESTRUCTIVE_TESTS=true bun run scripts/test-charity-system.ts")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error("Missing Supabase credentials in environment.")
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey)

async function runTestSuite() {
  console.log("================================================================")
  console.log("SCOREKIND SECURITY HARDENING & CHARITY SYSTEM TEST SUITE")
  console.log("================================================================")

  const timestamp = Date.now()
  const USER_A_EMAIL = `test-charity-a-${timestamp}@example.com`
  const USER_B_EMAIL = `test-charity-b-${timestamp}@example.com`
  const PASSWORD = "SecurePassword123!Test"

  let userAId = ""
  let userBId = ""

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Minor-unit calculation engine
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Monetary Allocation Engine Math...")
    const calc10 = calculateCharityAllocation({
      amountPaidMinor: 129900, // ₹1,299.00
      percentage: 10,
      currency: "inr",
    })
    if (calc10.allocationAmountMinor !== 12990 || calc10.allocationAmountMajor !== 129.90) {
      throw new Error(`10% calculation incorrect: got ${calc10.allocationAmountMajor}, expected 129.90`)
    }
    console.log("  ✓ 10% on ₹1,299 = ₹129.90 (12,990 paise)")

    const calc25 = calculateCharityAllocation({
      amountPaidMinor: 129900,
      percentage: 25,
      currency: "inr",
    })
    if (calc25.allocationAmountMinor !== 32475 || calc25.allocationAmountMajor !== 324.75) {
      throw new Error(`25% calculation incorrect: got ${calc25.allocationAmountMajor}, expected 324.75`)
    }
    console.log("  ✓ 25% on ₹1,299 = ₹324.75 (32,475 paise)")

    const calc100 = calculateCharityAllocation({
      amountPaidMinor: 1199900, // ₹11,999.00
      percentage: 100,
      currency: "inr",
    })
    if (calc100.allocationAmountMinor !== 1199900 || calc100.allocationAmountMajor !== 11999.0) {
      throw new Error(`100% calculation incorrect: got ${calc100.allocationAmountMajor}`)
    }
    console.log("  ✓ 100% on ₹11,999 = ₹11,999.00 (1,199,900 paise)")

    // -------------------------------------------------------------------------
    // TEST 2: Zod Validator Boundary Tests
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Charity Preference Zod Validation Bounds...")
    const validUuid = "1f0426d3-dbad-4614-abc4-94205c013d66"

    const test9 = charityPreferenceSchema.safeParse({ charityId: validUuid, contributionPercentage: 9 })
    if (test9.success) throw new Error("Validation FAILED: 9% should be rejected!")
    console.log("  ✓ 9% contribution rejected (minimum 10% enforced)")

    const test10 = charityPreferenceSchema.safeParse({ charityId: validUuid, contributionPercentage: 10 })
    if (!test10.success) throw new Error("Validation FAILED: 10% should be accepted!")
    console.log("  ✓ 10% contribution accepted")

    const test50 = charityPreferenceSchema.safeParse({ charityId: validUuid, contributionPercentage: 50 })
    if (!test50.success) throw new Error("Validation FAILED: 50% should be accepted!")
    console.log("  ✓ 50% contribution accepted")

    const test100 = charityPreferenceSchema.safeParse({ charityId: validUuid, contributionPercentage: 100 })
    if (!test100.success) throw new Error("Validation FAILED: 100% should be accepted!")
    console.log("  ✓ 100% contribution accepted")

    const test101 = charityPreferenceSchema.safeParse({ charityId: validUuid, contributionPercentage: 101 })
    if (test101.success) throw new Error("Validation FAILED: 101% should be rejected!")
    console.log("  ✓ 101% contribution rejected (maximum 100% enforced)")

    const testInvalidUuid = charityPreferenceSchema.safeParse({ charityId: "not-a-uuid", contributionPercentage: 15 })
    if (testInvalidUuid.success) throw new Error("Validation FAILED: Invalid UUID should be rejected!")
    console.log("  ✓ Invalid charityId rejected")

    // -------------------------------------------------------------------------
    // TEST 3: Atomic Stripe Webhook Claim RPC
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Atomic Stripe Webhook Claim RPC & Idempotency...")
    const testEventId = `evt_test_audit_${timestamp}`

    // 3A. First claim
    const { data: claim1, error: err1 } = await supabaseAdmin.rpc("claim_stripe_webhook_event", {
      p_event_id: testEventId,
      p_event_type: "invoice.payment_succeeded",
    })
    if (err1 || !claim1?.[0]?.claimed) {
      throw new Error(`First claim failed: ${err1?.message || JSON.stringify(claim1)}`)
    }
    console.log("  ✓ First event delivery: claimed=true, already_processed=false")

    // 3B. Concurrent second claim while still processing
    const { data: claim2 } = await supabaseAdmin.rpc("claim_stripe_webhook_event", {
      p_event_id: testEventId,
      p_event_type: "invoice.payment_succeeded",
    })
    if (claim2?.[0]?.claimed || claim2?.[0]?.already_processed) {
      throw new Error(`Concurrent claim should have been locked/blocked! ${JSON.stringify(claim2)}`)
    }
    console.log("  ✓ Concurrent delivery: claimed=false (prevented duplicate concurrent processing)")

    // 3C. Mark processed and test replay
    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("stripe_event_id", testEventId)

    const { data: claim3 } = await supabaseAdmin.rpc("claim_stripe_webhook_event", {
      p_event_id: testEventId,
      p_event_type: "invoice.payment_succeeded",
    })
    if (!claim3?.[0]?.already_processed) {
      throw new Error(`Processed event replay should return already_processed=true! ${JSON.stringify(claim3)}`)
    }
    console.log("  ✓ Replay of processed event: already_processed=true, acknowledged with duplicate=true")

    // Cleanup test event
    await supabaseAdmin.from("stripe_webhook_events").delete().eq("stripe_event_id", testEventId)

    // -------------------------------------------------------------------------
    // TEST 4: Provision Users and Test has_active_subscription() Privacy Guard
    // -------------------------------------------------------------------------
    console.log("\n[TEST 4] Provisioning Test Subscribers...")
    const { data: uA } = await supabaseAdmin.auth.admin.createUser({
      email: USER_A_EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Subscriber A" },
    })
    userAId = uA.user!.id

    const { data: uB } = await supabaseAdmin.auth.admin.createUser({
      email: USER_B_EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Subscriber B (Active)" },
    })
    userBId = uB.user!.id

    // Give User B an active subscription
    const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString()
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userBId,
      plan: "monthly",
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd,
      provider_customer_id: `cus_test_${userBId.slice(0, 8)}`,
      provider_subscription_id: `sub_test_${userBId.slice(0, 8)}`,
    })
    console.log(`  ✓ User A: ${userAId} (no subscription)`)
    console.log(`  ✓ User B: ${userBId} (active subscription until ${periodEnd})`)

    // Authenticate as User A and User B
    const clientA = createClient<Database>(supabaseUrl, anonKey)
    const { data: authA } = await clientA.auth.signInWithPassword({
      email: USER_A_EMAIL,
      password: PASSWORD,
    })
    if (!authA.session) throw new Error("Failed to sign in User A")

    const clientB = createClient<Database>(supabaseUrl, anonKey)
    const { data: authB } = await clientB.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: PASSWORD,
    })
    if (!authB.session) throw new Error("Failed to sign in User B")

    console.log("\n[TEST 5] Function Security: has_active_subscription() Cross-User Probing...")

    // 5A. User B checks their own subscription -> TRUE
    const { data: checkOwnB } = await clientB.rpc("has_active_subscription", {
      check_user_id: userBId,
    })
    if (checkOwnB !== true) {
      throw new Error(`User B checking own status should be true, got ${checkOwnB}`)
    }
    console.log("  ✓ User B checking own subscription status returns TRUE")

    // 5B. User A checks User B's subscription -> MUST BE FALSE (Cross-user enumeration blocked!)
    const { data: probeVictim } = await clientA.rpc("has_active_subscription", {
      check_user_id: userBId,
    })
    if (probeVictim !== false) {
      throw new Error(`SECURITY VULNERABILITY: User A was able to discover User B has an active subscription! Got ${probeVictim}`)
    }
    console.log("  ✓ Cross-user probe: User A checking User B returns FALSE (Privacy protected!)")

    // 5C. User A checks own status -> FALSE
    const { data: checkOwnA } = await clientA.rpc("has_active_subscription", {
      check_user_id: userAId,
    })
    if (checkOwnA !== false) {
      throw new Error(`User A checking own status should be false, got ${checkOwnA}`)
    }
    console.log("  ✓ User A checking own subscription returns FALSE")

    // -------------------------------------------------------------------------
    // TEST 6: RLS Isolation on Charity Preferences & Contributions
    // -------------------------------------------------------------------------
    console.log("\n[TEST 6] Row Level Security (RLS) Isolation...")

    // Fetch an active partner charity
    const { data: activeCharities } = await supabaseAdmin
      .from("charities")
      .select("id")
      .eq("status", "active")
      .limit(1)

    const charityId = activeCharities?.[0]?.id
    if (!charityId) throw new Error("No active charity found for RLS test!")

    // 6A. User A sets own preference -> allowed
    const { error: setPrefError } = await clientA.from("charity_preferences").insert({
      user_id: userAId,
      charity_id: charityId,
      contribution_percentage: 15,
    })
    if (setPrefError) throw new Error(`User A should be able to set own preference: ${setPrefError.message}`)
    console.log("  ✓ User A successfully saved own charity preference (15%)")

    // 6B. User B attempts to read User A's preference -> BLOCKED by RLS
    const { data: readVictimPref } = await clientB
      .from("charity_preferences")
      .select("*")
      .eq("user_id", userAId)

    if (readVictimPref && readVictimPref.length > 0) {
      throw new Error("SECURITY BREACH: User B read User A's charity preference!")
    }
    console.log("  ✓ User B cannot read User A's charity preference (RLS blocked)")

    // 6C. User A attempts to fabricate a direct contribution -> BLOCKED by RLS
    const { error: fabricateError } = await clientA.from("charity_contributions").insert({
      user_id: userAId,
      charity_id: charityId,
      amount: 500,
      percentage: 10,
      type: "subscription",
      status: "completed",
    })
    if (!fabricateError) {
      throw new Error("SECURITY BREACH: Unprivileged subscriber fabricated a charity contribution!")
    }
    console.log("  ✓ Subscriber cannot fabricate direct charity contribution (RLS blocked)")

    // 6D. Subscriber cannot create a charity -> BLOCKED by RLS
    const { error: createCharityError } = await clientA.from("charities").insert({
      name: "Fake Charity",
      slug: `fake-charity-${timestamp}`,
      status: "active",
      featured: false,
    })
    if (!createCharityError) {
      throw new Error("SECURITY BREACH: Unprivileged subscriber created a charity in public.charities!")
    }
    console.log("  ✓ Subscriber cannot create or manage charities (RLS blocked)")

    // -------------------------------------------------------------------------
    // TEST 7: Idempotent Invoice Contribution Recording
    // -------------------------------------------------------------------------
    console.log("\n[TEST 7] Contribution Allocation Idempotency...")
    const testInvoiceId = `in_test_invoice_${timestamp}`

    // 7A. Record allocation
    const { data: contrib1, error: cErr1 } = await supabaseAdmin
      .from("charity_contributions")
      .insert({
        user_id: userBId,
        charity_id: charityId,
        provider_invoice_id: testInvoiceId,
        currency: "inr",
        amount: 129.90,
        percentage: 10,
        type: "subscription",
        status: "completed",
      })
      .select("id")
      .single()

    if (cErr1 || !contrib1) throw new Error(`Failed to record first allocation: ${cErr1?.message}`)
    console.log(`  ✓ Allocation recorded: ID=${contrib1.id} for invoice ${testInvoiceId}`)

    // 7B. Duplicate attempt with identical invoice ID -> Unique constraint violation
    const { error: cErr2 } = await supabaseAdmin.from("charity_contributions").insert({
      user_id: userBId,
      charity_id: charityId,
      provider_invoice_id: testInvoiceId,
      currency: "inr",
      amount: 129.90,
      percentage: 10,
      type: "subscription",
      status: "completed",
    })

    if (!cErr2 || cErr2.code !== "23505") {
      throw new Error("IDEMPOTENCY FAILURE: Duplicate invoice allocation was NOT rejected by unique constraint!")
    }
    console.log("  ✓ Retried webhook invoice allocation blocked by PostgreSQL UNIQUE index (23505)")

    // Cleanup test contribution
    await supabaseAdmin.from("charity_contributions").delete().eq("provider_invoice_id", testInvoiceId)

    console.log("\n================================================================")
    console.log("ALL SECURITY & CHARITY VERIFICATION TESTS PASSED SUCCESSFULLY! ✓")
    console.log("================================================================\n")
  } finally {
    // Clean up test users
    if (userAId) {
      await supabaseAdmin.from("charity_preferences").delete().eq("user_id", userAId)
      await supabaseAdmin.auth.admin.deleteUser(userAId)
    }
    if (userBId) {
      await supabaseAdmin.from("subscriptions").delete().eq("user_id", userBId)
      await supabaseAdmin.from("charity_preferences").delete().eq("user_id", userBId)
      await supabaseAdmin.auth.admin.deleteUser(userBId)
    }
  }
}

runTestSuite().catch((err) => {
  console.error("\nTEST SUITE FAILED WITH ERROR:", err)
  process.exit(1)
})
