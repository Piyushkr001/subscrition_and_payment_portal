export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "subscriber" | "admin"
export type SubscriptionPlan = "monthly" | "yearly"
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "incomplete"
export type CharityStatus = "draft" | "active" | "inactive"
export type ContributionType = "subscription" | "donation"
export type ContributionStatus = "pending" | "completed" | "failed"
export type DrawType = "random" | "weighted"
export type DrawStatus =
  | "draft"
  | "simulated"
  | "locked"
  | "published"
  | "completed"
export type PrizeTier = "three_match" | "four_match" | "five_match"
export type WinnerVerificationStatus = "pending" | "approved" | "rejected"
export type PayoutStatus = "pending" | "paid"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          plan: SubscriptionPlan | null
          status: SubscriptionStatus | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          plan?: SubscriptionPlan | null
          status?: SubscriptionStatus | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          plan?: SubscriptionPlan | null
          status?: SubscriptionStatus | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          score_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          score_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          score_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      charities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          cover_url: string | null
          website_url: string | null
          status: CharityStatus
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          website_url?: string | null
          status?: CharityStatus
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          cover_url?: string | null
          website_url?: string | null
          status?: CharityStatus
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      charity_preferences: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          contribution_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          charity_id: string
          contribution_percentage: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          charity_id?: string
          contribution_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      charity_contributions: {
        Row: {
          id: string
          user_id: string
          charity_id: string
          subscription_id: string | null
          amount: number
          percentage: number
          type: ContributionType
          status: ContributionStatus
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          charity_id: string
          subscription_id?: string | null
          amount: number
          percentage: number
          type: ContributionType
          status?: ContributionStatus
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          charity_id?: string
          subscription_id?: string | null
          amount?: number
          percentage?: number
          type?: ContributionType
          status?: ContributionStatus
          created_at?: string
        }
        Relationships: []
      }
      draws: {
        Row: {
          id: string
          draw_date: string
          draw_type: DrawType
          status: DrawStatus
          numbers: Json | null
          subscriber_count: number
          base_prize_pool: number
          rollover_amount: number
          final_prize_pool: number
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          draw_date: string
          draw_type: DrawType
          status?: DrawStatus
          numbers?: Json | null
          subscriber_count?: number
          base_prize_pool?: number
          rollover_amount?: number
          final_prize_pool?: number
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          draw_date?: string
          draw_type?: DrawType
          status?: DrawStatus
          numbers?: Json | null
          subscriber_count?: number
          base_prize_pool?: number
          rollover_amount?: number
          final_prize_pool?: number
          created_at?: string
          published_at?: string | null
        }
        Relationships: []
      }
      draw_entries: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          scores_snapshot: Json
          subscription_snapshot: Json
          eligible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          scores_snapshot: Json
          subscription_snapshot: Json
          eligible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          draw_id?: string
          user_id?: string
          scores_snapshot?: Json
          subscription_snapshot?: Json
          eligible?: boolean
          created_at?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          id: string
          draw_id: string
          user_id: string
          match_count: number
          prize_tier: PrizeTier
          prize_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          draw_id: string
          user_id: string
          match_count: number
          prize_tier: PrizeTier
          prize_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          draw_id?: string
          user_id?: string
          match_count?: number
          prize_tier?: PrizeTier
          prize_amount?: number
          created_at?: string
        }
        Relationships: []
      }
      winner_verifications: {
        Row: {
          id: string
          winner_id: string
          proof_url: string | null
          status: WinnerVerificationStatus
          reviewed_by: string | null
          review_notes: string | null
          submitted_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          winner_id: string
          proof_url?: string | null
          status?: WinnerVerificationStatus
          reviewed_by?: string | null
          review_notes?: string | null
          submitted_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          winner_id?: string
          proof_url?: string | null
          status?: WinnerVerificationStatus
          reviewed_by?: string | null
          review_notes?: string | null
          submitted_at?: string
          reviewed_at?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          id: string
          winner_id: string
          amount: number
          status: PayoutStatus
          reference: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          winner_id: string
          amount: number
          status?: PayoutStatus
          reference?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          winner_id?: string
          amount?: number
          status?: PayoutStatus
          reference?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
