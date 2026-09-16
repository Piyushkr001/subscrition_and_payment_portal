import { Users } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          User Management
        </h1>
        <p className="text-sm text-muted-foreground">
          View registered subscribers and role assignments.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>User Roster</CardTitle>
          <CardDescription>
            All profiles registered in the ScoreKind system.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            User Management Shell
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Future milestones will include user search, role adjustments, and
            account auditing tools.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
