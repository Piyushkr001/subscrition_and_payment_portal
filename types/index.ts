import type { Database } from "./database"

export * from "./database"

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Profile = Tables<"profiles">
export type Subscription = Tables<"subscriptions">
export type Score = Tables<"scores">
export type Charity = Tables<"charities">
export type CharityPreference = Tables<"charity_preferences">
export type CharityContribution = Tables<"charity_contributions">
export type Draw = Tables<"draws">
export type DrawEntry = Tables<"draw_entries">
export type Winner = Tables<"winners">
export type WinnerVerification = Tables<"winner_verifications">
export type Payout = Tables<"payouts">

export interface AuthUserSession {
  id: string
  email: string
  fullName?: string
  role: "subscriber" | "admin"
}
