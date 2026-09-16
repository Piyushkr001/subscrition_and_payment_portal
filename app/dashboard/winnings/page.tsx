import { Gift } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardWinningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Prize Winnings & Claims
        </h1>
        <p className="text-sm text-muted-foreground">
          View your match results, verification statuses, and payout records.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Winnings History</CardTitle>
          <CardDescription>
            3-match, 4-match, and 5-match prize payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Gift className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No winnings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Draw participation and prize claims will show here when your scores
            match winning draw numbers.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
