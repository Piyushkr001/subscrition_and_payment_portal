import { Metadata } from "next"
import { getScores } from "@/lib/scores/actions"
import { canManageScores } from "@/lib/scores/subscription-check"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { ScoresClient } from "@/components/scores/scores-client"

export const metadata: Metadata = {
  title: "My Scores | ScoreKind",
  description: "Manage your Stableford rounds and track your latest five golf scores.",
}

export default async function DashboardScoresPage() {
  const user = await getCurrentUser()
  const scores = await getScores()
  const access = user ? await canManageScores(user.id) : { allowed: false, reason: "Authentication required." }

  return (
    <ScoresClient
      initialScores={scores}
      canManage={access.allowed}
      accessReason={access.reason}
    />
  )
}
