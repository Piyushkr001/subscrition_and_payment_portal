import { CreditCard } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Subscription Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor active, cancelled, and past due member billing cycles.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Member Subscriptions</CardTitle>
          <CardDescription>
            Stripe billing integrations will populate this table in upcoming
            milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CreditCard className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">
            No Subscriptions Recorded
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Future Stripe webhook events will synchronize customer and
            subscription records directly into the subscriptions table.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
