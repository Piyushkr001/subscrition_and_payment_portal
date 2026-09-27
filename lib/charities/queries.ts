import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export type CharityRow = Database["public"]["Tables"]["charities"]["Row"]
export type CharityPreferenceRow = Database["public"]["Tables"]["charity_preferences"]["Row"]
export type CharityContributionRow = Database["public"]["Tables"]["charity_contributions"]["Row"]

export interface EnrichedCharityPreference extends CharityPreferenceRow {
  charity: CharityRow | null
}

export interface EnrichedCharityContribution extends CharityContributionRow {
  charity: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  } | null
}

export interface AdminCharityItem extends CharityRow {
  totalAllocationsCount: number
  totalAllocatedAmount: number
  activeSubscribersCount: number
}

/**
 * Fetch all verified, active partner charities for public directory & subscriber selection.
 */
export async function getActiveCharities(): Promise<CharityRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("name", { ascending: true })

  if (error) {
    console.error("[Charities Query]: Error fetching active charities:", error)
    return []
  }

  return data || []
}

/**
 * Fetch a single charity by unique slug.
 * By default, public users can only view active charities; admins can inspect drafts.
 */
export async function getCharityBySlug(
  slug: string,
  isAdmin: boolean = false
): Promise<CharityRow | null> {
  const supabase = await createClient()

  let query = supabase.from("charities").select("*").eq("slug", slug)

  if (!isAdmin) {
    query = query.eq("status", "active")
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error(`[Charities Query]: Error fetching charity by slug '${slug}':`, error)
    return null
  }

  return data
}

/**
 * Fetch current subscriber's saved charity preference along with partner details.
 */
export async function getUserCharityPreference(
  userId: string
): Promise<EnrichedCharityPreference | null> {
  if (!userId) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("charity_preferences")
    .select(`
      *,
      charity:charities (*)
    `)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[Charities Query]: Error fetching user charity preference:", error)
    return null
  }

  if (!data) return null

  return {
    ...data,
    charity: (data.charity as unknown as CharityRow) || null,
  }
}

/**
 * Fetch contribution allocation ledger history for a specific subscriber.
 */
export async function getUserCharityContributions(
  userId: string
): Promise<{
  contributions: EnrichedCharityContribution[]
  totalAllocated: number
  count: number
}> {
  if (!userId) {
    return { contributions: [], totalAllocated: 0, count: 0 }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("charity_contributions")
    .select(`
      *,
      charity:charities (id, name, slug, logo_url)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Charities Query]: Error fetching user charity contributions:", error)
    return { contributions: [], totalAllocated: 0, count: 0 }
  }

  const contributions = (data || []).map((row) => ({
    ...row,
    charity: (row.charity as unknown as EnrichedCharityContribution["charity"]) || null,
  }))

  const totalAllocated = contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return {
    contributions,
    totalAllocated: Number(totalAllocated.toFixed(2)),
    count: contributions.length,
  }
}

/**
 * Fetch all charities for administrator management with allocation metrics.
 */
export async function getAllCharitiesAdmin(): Promise<AdminCharityItem[]> {
  const supabase = await createClient()

  // 1. Fetch all charity records
  const { data: charities, error: charitiesError } = await supabase
    .from("charities")
    .select("*")
    .order("created_at", { ascending: false })

  if (charitiesError || !charities) {
    console.error("[Charities Admin Query]: Error fetching charities:", charitiesError)
    return []
  }

  // 2. Fetch all contributions for ledger aggregations
  const { data: contributions } = await supabase
    .from("charity_contributions")
    .select("charity_id, amount")

  // 3. Fetch all preferences for active subscriber counts
  const { data: preferences } = await supabase
    .from("charity_preferences")
    .select("charity_id")

  // Aggregate metrics per charity
  const contribMap = new Map<string, { count: number; total: number }>()
  for (const c of contributions || []) {
    const existing = contribMap.get(c.charity_id) || { count: 0, total: 0 }
    contribMap.set(c.charity_id, {
      count: existing.count + 1,
      total: existing.total + Number(c.amount || 0),
    })
  }

  const prefMap = new Map<string, number>()
  for (const p of preferences || []) {
    prefMap.set(p.charity_id, (prefMap.get(p.charity_id) || 0) + 1)
  }

  return charities.map((ch) => {
    const metrics = contribMap.get(ch.id) || { count: 0, total: 0 }
    const subsCount = prefMap.get(ch.id) || 0
    return {
      ...ch,
      totalAllocationsCount: metrics.count,
      totalAllocatedAmount: Number(metrics.total.toFixed(2)),
      activeSubscribersCount: subsCount,
    }
  })
}
