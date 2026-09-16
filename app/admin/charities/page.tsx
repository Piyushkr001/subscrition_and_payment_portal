import { HeartHandshake } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminCharitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Charity Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Add, verify, and feature charitable partners eligible for member
          contributions.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Partner Roster</CardTitle>
          <CardDescription>
            RLS allows public users to view active charities while restricting
            edits to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <HeartHandshake className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            No Charities Listed Yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Admin charity CRUD operations and featured flags will be built in
            the Charity Governance milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
