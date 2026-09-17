import { CreditCard } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function AdminSubscriptionsPage() {
  const supabaseAdmin = createAdminClient()

  // Query subscriptions joined with member profile details
  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      user_id,
      provider_customer_id,
      provider_subscription_id,
      plan,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })

  const subList = subscriptions || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Subscription Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor active, cancelled, and past due member billing cycles synchronized from Stripe.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Member Subscriptions</CardTitle>
              <CardDescription>
                Live subscription synchronization from Stripe webhooks.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-semibold">
              {subList.length} Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {subList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <CreditCard className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                No Subscriptions Recorded
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Stripe webhook events will automatically synchronize customer and subscription records directly into this view.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stripe Sub ID</TableHead>
                    <TableHead>Current Period End</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subList.map((sub) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const profile = sub.profiles as any
                    const memberName = profile?.full_name || profile?.email || sub.user_id
                    const isActive = sub.status === "active" || sub.status === "trialing"

                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {memberName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {profile?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {sub.plan || "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] capitalize font-medium ${
                              isActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : sub.status === "past_due"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          {sub.provider_subscription_id || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.current_period_end
                            ? new Date(sub.current_period_end).toLocaleDateString("en-GB")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString("en-GB")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
