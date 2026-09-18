/**
 * Real Supabase JWT RLS Bypass & Subscription Authorization Test Suite
 *
 * This test verifies PostgreSQL Row Level Security (RLS) policies directly
 * using actual authenticated subscriber JWT access tokens.
 *
 * CRITICAL:
 * It uses unprivileged Supabase clients with real user JWTs.
 * It NEVER uses SUPABASE_SERVICE_ROLE_KEY to perform score operations.
 *
 * Tests:
 * 1. Inactive User A (no subscription) CANNOT INSERT a score directly via Supabase.
 * 2. Active User B (active subscription) CAN INSERT their own score.
 * 3. Inactive User A CANNOT UPDATE a score.
 * 4. User A CANNOT READ or UPDATE User B's score.
 * 5. User A CANNOT DELETE User B's score.
 * 6. Lapsed subscription check: cancelling User B's subscription blocks subsequent inserts.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"

if (process.env.NODE_ENV === "production") {
  console.error("FATAL: Test scripts cannot run against production environment.")
  process.exit(1)
}

if (process.env.ALLOW_DESTRUCTIVE_TESTS !== "true") {
  console.error("SAFETY GUARD: Refusing to run tests without explicit ALLOW_DESTRUCTIVE_TESTS=true.")
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  console.error("Missing Supabase environment variables.")
  process.exit(1)
}

const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey)

const USER_A_EMAIL = `scorekind-test-inactive-a-${Date.now()}@example.com`
const USER_B_EMAIL = `scorekind-test-active-b-${Date.now()}@example.com`
const SHARED_PASSWORD = "TestPassword123!Secure"

async function runRlsTests() {
  console.log("==================================================")
  console.log("REAL USER JWT RLS ISOLATION & BYPASS TEST SUITE")
  console.log("==================================================")

  // 1. Provision User A (Inactive, no subscription)
  const { data: userACreated, error: userAError } = await supabaseAdmin.auth.admin.createUser({
    email: USER_A_EMAIL,
    password: SHARED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Inactive User A" },
  })

  if (userAError || !userACreated.user) {
    throw new Error(`Failed to create User A: ${userAError?.message}`)
  }
  const userAId = userACreated.user.id
  console.log(`✓ Provisioned Inactive User A: ${USER_A_EMAIL} (${userAId})`)

  // 2. Provision User B (Active subscriber)
  const { data: userBCreated, error: userBError } = await supabaseAdmin.auth.admin.createUser({
    email: USER_B_EMAIL,
    password: SHARED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Active User B" },
  })

  if (userBError || !userBCreated.user) {
    throw new Error(`Failed to create User B: ${userBError?.message}`)
  }
  const userBId = userBCreated.user.id
  console.log(`✓ Provisioned Active User B: ${USER_B_EMAIL} (${userBId})`)

  // 3. Attach active subscription to User B in PostgreSQL
  const oneMonthLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { error: subBError } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userBId,
    plan: "monthly",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: oneMonthLater,
    provider_customer_id: `cus_test_${userBId.slice(0, 8)}`,
    provider_subscription_id: `sub_test_${userBId.slice(0, 8)}`,
  })

  if (subBError) {
    throw new Error(`Failed to provision active subscription for User B: ${subBError.message}`)
  }
  console.log(`✓ Active subscription attached to User B (valid until ${oneMonthLater})`)

  try {
    // 4. Authenticate User A and User B to obtain REAL Supabase JWTs
    const authClientA = createClient<Database>(supabaseUrl, anonKey)
    const { data: sessionA, error: loginAError } = await authClientA.auth.signInWithPassword({
      email: USER_A_EMAIL,
      password: SHARED_PASSWORD,
    })

    if (loginAError || !sessionA?.session?.access_token) {
      throw new Error(`User A sign-in failed: ${loginAError?.message}`)
    }

    const authClientB = createClient<Database>(supabaseUrl, anonKey)
    const { data: sessionB, error: loginBError } = await authClientB.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: SHARED_PASSWORD,
    })

    if (loginBError || !sessionB?.session?.access_token) {
      throw new Error(`User B sign-in failed: ${loginBError?.message}`)
    }

    console.log("✓ Successfully obtained real Supabase JWT access tokens for User A and User B")

    // Create non-privileged clients using authenticated JWT sessions
    const clientUserA = createClient<Database>(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionA.session.access_token}`,
        },
      },
    })

    const clientUserB = createClient<Database>(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionB.session.access_token}`,
        },
      },
    })

    console.log("\n==================================================")
    console.log("TEST 1: INACTIVE USER A CANNOT INSERT SCORE (RLS)")
    console.log("==================================================")

    const { error: userAInsertError } = await clientUserA.from("scores").insert({
      user_id: userAId,
      score: 36,
      score_date: "2026-09-10",
    })

    if (userAInsertError) {
      console.log(`✓ RLS successfully BLOCKED Inactive User A score insertion: ${userAInsertError.message} (Code: ${userAInsertError.code})`)
    } else {
      throw new Error("SECURITY FAILURE: Inactive User A was able to insert score directly via Supabase client!")
    }

    console.log("\n==================================================")
    console.log("TEST 2: ACTIVE USER B CAN INSERT OWN SCORE (RLS)")
    console.log("==================================================")

    const { data: userBScore, error: userBInsertError } = await clientUserB
      .from("scores")
      .insert({
        user_id: userBId,
        score: 40,
        score_date: "2026-09-10",
      })
      .select()
      .single()

    if (userBInsertError || !userBScore) {
      throw new Error(`Active User B score insertion failed: ${userBInsertError?.message}`)
    }
    console.log(`✓ Active User B successfully inserted score: ID ${userBScore.id} (Score: ${userBScore.score})`)

    console.log("\n==================================================")
    console.log("TEST 3: CROSS-USER TENANT ISOLATION (RLS)")
    console.log("==================================================")

    // User A attempts to read User B's score
    const { data: userAReadB } = await clientUserA
      .from("scores")
      .select("*")
      .eq("id", userBScore.id)

    if (!userAReadB || userAReadB.length === 0) {
      console.log("✓ User A cannot read User B's score (RLS filtered out rows)")
    } else {
      throw new Error("SECURITY FAILURE: User A was able to read User B's score!")
    }

    // User A attempts to update User B's score
    const { error: updateError } = await clientUserA
      .from("scores")
      .update({ score: 10 })
      .eq("id", userBScore.id)

    if (updateError) {
      console.log(`✓ RLS rejected cross-user update attempt: ${updateError.message}`)
    }

    // Either 42501 or 0 rows modified
    const { data: verifyUnchanged } = await supabaseAdmin
      .from("scores")
      .select("score")
      .eq("id", userBScore.id)
      .single()

    if (verifyUnchanged?.score === 40) {
      console.log("✓ User A cannot update User B's score (Score remains unchanged at 40)")
    } else {
      throw new Error("SECURITY FAILURE: User A modified User B's score!")
    }

    // User A attempts to delete User B's score
    await clientUserA.from("scores").delete().eq("id", userBScore.id)

    const { data: verifyStillExists } = await supabaseAdmin
      .from("scores")
      .select("id")
      .eq("id", userBScore.id)
      .maybeSingle()

    if (verifyStillExists) {
      console.log("✓ User A cannot delete User B's score (Score row safely preserved)")
    } else {
      throw new Error("SECURITY FAILURE: User A deleted User B's score!")
    }

    console.log("\n==================================================")
    console.log("TEST 4: LAPSED SUBSCRIPTION ENFORCEMENT")
    console.log("==================================================")

    // Update User B's subscription to 'cancelled'
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", current_period_end: new Date(Date.now() - 1000).toISOString() })
      .eq("user_id", userBId)

    console.log("✓ Transitioned User B subscription to 'cancelled' (lapsed)")

    // User B now attempts to insert a new score with their JWT
    const { error: lapsedInsertError } = await clientUserB.from("scores").insert({
      user_id: userBId,
      score: 35,
      score_date: "2026-09-12",
    })

    if (lapsedInsertError) {
      console.log(`✓ RLS successfully BLOCKED lapsed User B: ${lapsedInsertError.message}`)
    } else {
      throw new Error("SECURITY FAILURE: Lapsed subscriber was able to insert score!")
    }

  } finally {
    console.log("\n==================================================")
    console.log("CLEANUP: REMOVING ONLY DEDICATED TEST DATA")
    console.log("==================================================")

    await supabaseAdmin.from("scores").delete().in("user_id", [userAId, userBId])
    await supabaseAdmin.from("subscriptions").delete().in("user_id", [userAId, userBId])
    await supabaseAdmin.from("stripe_customers").delete().in("user_id", [userAId, userBId])
    await supabaseAdmin.from("profiles").delete().in("id", [userAId, userBId])
    await supabaseAdmin.auth.admin.deleteUser(userAId)
    await supabaseAdmin.auth.admin.deleteUser(userBId)
    console.log(`✓ Cleaned up test users ${userAId} and ${userBId}`)
  }

  console.log("\n==================================================")
  console.log("ALL REAL JWT RLS BYPASS TESTS PASSED!")
  console.log("==================================================")
}

runRlsTests().catch((err) => {
  console.error("RLS Test Suite Failed:", err)
  process.exit(1)
})
