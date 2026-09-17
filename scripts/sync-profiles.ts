/**
 * Script: sync-profiles.ts
 * Purpose: Ensures all users in auth.users have corresponding records in public.profiles.
 * Usage: bun run scripts/sync-profiles.ts
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

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function sync() {
  console.log("Fetching users from auth.users...")
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("Failed to list users from auth.users:", authError.message)
    process.exit(1)
  }

  console.log(`Found ${authData.users.length} users in auth.users. Syncing to public.profiles...`)

  for (const u of authData.users) {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", u.id)
      .maybeSingle()

    const role = existingProfile?.role || (u.email?.includes("admin") ? "admin" : "subscriber")
    const fullName =
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      u.email?.split("@")[0] ||
      "User"
    const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || null

    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: u.id,
        email: u.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: role,
        created_at: u.created_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (upsertError) {
      console.error(`Error syncing ${u.email}:`, upsertError.message)
    } else {
      console.log(`✓ Synced ${u.email} -> role: ${role}`)
    }
  }

  console.log("Profile synchronization complete.")
}

sync().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
