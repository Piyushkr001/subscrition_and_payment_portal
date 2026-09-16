import { Trophy } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminDrawsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Draw Orchestration
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure monthly draw dates, simulate prize pools, and publish winning
          numbers.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Draw Cycles</CardTitle>
          <CardDescription>
            Statuses: draft, simulated, locked, published, completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Trophy className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No Active Draw Cycles</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Draw generation, weighted score algorithms, and snapshot locks will be
            implemented in the Monthly Draws milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
