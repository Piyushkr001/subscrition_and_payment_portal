/**
 * Script: promote-admin.ts
 * Purpose: Privileged CLI utility to promote a registered user to 'admin'.
 * Usage: bun run scripts/promote-admin.ts <user-email>
 *
 * NOTE: This is a secure server-side script using the service role key.
 * Never expose role promotion through public API endpoints.
 */

import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment."
  )
  process.exit(1)
}

const emailToPromote = process.argv[2]?.trim().toLowerCase()

if (!emailToPromote) {
  console.error("Usage: bun run scripts/promote-admin.ts <user-email>")
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function promote() {
  const { data: profiles, error: findError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("email", emailToPromote)

  if (findError) {
    console.error("Database query failed:", findError.message)
    process.exit(1)
  }

  if (!profiles || profiles.length === 0) {
    console.error(
      `No profile found for email "${emailToPromote}". Please ensure the user has signed up first.`
    )
    process.exit(1)
  }

  const profile = profiles[0]

  if (profile.role === "admin") {
    console.log(`User ${emailToPromote} (${profile.id}) is ALREADY an admin.`)
    process.exit(0)
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .eq("id", profile.id)

  if (updateError) {
    console.error("Failed to promote user:", updateError.message)
    process.exit(1)
  }

  console.log(
    `SUCCESS: User ${profile.full_name || emailToPromote} (${profile.id}) promoted to role 'admin'.`
  )
}

promote().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
