import { Award } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminWinnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Winner Verifications & Claims
        </h1>
        <p className="text-sm text-muted-foreground">
          Review member scorecards, approve claims, and manage payout
          authorizations.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Claims Queue</CardTitle>
          <CardDescription>
            Statuses: pending, approved, rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Award className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No Pending Claims</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Winner matching algorithms and proof verification workflows will be
            implemented in the Winner Verification milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
