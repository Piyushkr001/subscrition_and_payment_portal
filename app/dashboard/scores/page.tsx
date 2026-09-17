import { Metadata } from "next"
import { getScores } from "@/lib/scores/actions"
import { ScoresClient } from "@/components/scores/scores-client"

export const metadata: Metadata = {
  title: "My Scores | ScoreKind",
  description: "Manage your Stableford rounds and track your latest five golf scores.",
}

export default async function DashboardScoresPage() {
  const scores = await getScores()

  return <ScoresClient initialScores={scores} />
}
