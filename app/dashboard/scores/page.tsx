import { Target, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DashboardScoresPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Golf Score Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your 18-hole Stableford scores (valid range: 1 to 45 points).
          </p>
        </div>

        <Button disabled className="gap-2">
          <Plus className="size-4" />
          Add Score
        </Button>
      </div>

      <Alert className="border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-300">
        <AlertCircle className="size-4 text-teal-600 dark:text-teal-400" />
        <AlertTitle>Next Development Milestone: Score Management Engine</AlertTitle>
        <AlertDescription className="text-xs">
          The database table `scores` (with 1-45 range constraint and one entry
          per user/date) is provisioned. Full score entry, rolling-five active
          scores, and history management are scheduled for the next milestone.
        </AlertDescription>
      </Alert>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Score History</CardTitle>
          <CardDescription>
            Your latest 5 scores will form your draw entry snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Target className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No scores added yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Once score management is active, you will be able to log your rounds
            and track your handicap and draw numbers.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
