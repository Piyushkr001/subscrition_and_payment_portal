import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/require-admin"
import { getAllCharitiesAdmin } from "@/lib/charities/queries"
import { AdminCharitiesClient } from "@/components/admin/admin-charities-client"

export const metadata: Metadata = {
  title: "Charity Management | ScoreKind Admin",
  description: "Manage accredited partner charities, track member allocations, and configure cause features.",
}

export default async function AdminCharitiesPage() {
  await requireAdmin()
  const charities = await getAllCharitiesAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Charity Governance & Allocations
        </h1>
        <p className="text-sm text-muted-foreground">
          Onboard, verify, feature, and audit charitable partners eligible for member
          subscription contributions.
        </p>
      </div>

      <AdminCharitiesClient initialCharities={charities} />
    </div>
  )
}
