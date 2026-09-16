import { BarChart3 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Financial & Giving Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Monthly reconciliation, prize disbursements, and charity contribution
          audits.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Platform Audits</CardTitle>
          <CardDescription>
            Independent audit trail for draw results and charity remittance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BarChart3 className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No Reports Generated</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Auditing and compliance reports will generate automatically at the
            conclusion of each monthly billing and draw cycle.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
