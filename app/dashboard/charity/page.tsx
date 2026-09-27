import type { Metadata } from "next"
import { requireUser } from "@/lib/auth/require-user"
import {
  getUserCharityPreference,
  getActiveCharities,
  getUserCharityContributions,
} from "@/lib/charities/queries"
import { CharityPreferenceClient } from "@/components/dashboard/charity-preference-client"

export const metadata: Metadata = {
  title: "Charity Preference | ScoreKind Dashboard",
  description: "Nominate your partner charity and configure your monthly subscription allocation percentage.",
}

interface DashboardCharityPageProps {
  searchParams: Promise<{
    select?: string
  }>
}

export default async function DashboardCharityPage({
  searchParams,
}: DashboardCharityPageProps) {
  const { user } = await requireUser("/login")
  const { select } = await searchParams

  const [initialPreference, activeCharities, { contributions, totalAllocated }] =
    await Promise.all([
      getUserCharityPreference(user.id),
      getActiveCharities(),
      getUserCharityContributions(user.id),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Charity Preference & Giving Ledger
        </h1>
        <p className="text-sm text-muted-foreground">
          Nominate the verified charity partner that receives at least 10% (up to 100%) of
          your monthly ScoreKind subscription.
        </p>
      </div>

      <CharityPreferenceClient
        initialPreference={initialPreference}
        activeCharities={activeCharities}
        contributions={contributions}
        totalAllocated={totalAllocated}
        preselectedCharityId={select}
      />
    </div>
  )
}
