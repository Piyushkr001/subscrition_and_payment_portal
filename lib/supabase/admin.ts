import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

/**
 * Privileged server-only Supabase client that bypasses Row Level Security (RLS).
 * MUST only be used for trusted administrative tasks (e.g. promoting initial admin, webhooks).
 * NEVER expose this client or the service role key to browser/client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured in environment variables."
    )
  }

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
