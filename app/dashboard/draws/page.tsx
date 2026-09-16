import { Trophy } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardDrawsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Monthly Draws & Results
        </h1>
        <p className="text-sm text-muted-foreground">
          View scheduled draws, prize pools, and historical draw numbers.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Upcoming Draw</CardTitle>
          <CardDescription>
            Draws take place on the last calendar day of each month.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Trophy className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            No upcoming draw available
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Draw schedules and verified prize pools will appear here once
            published by the administrators.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
