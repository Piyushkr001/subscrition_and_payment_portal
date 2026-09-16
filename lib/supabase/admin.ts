import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Privileged server-only Supabase client that bypasses Row Level Security (RLS).
 * MUST only be used for trusted administrative tasks (e.g. promoting initial admin, webhooks).
 * NEVER expose this client or the service role key to browser/client components.
 */
export function createAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables."
    )
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
