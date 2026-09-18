import { CreditCard, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createAdminClient } from "@/lib/supabase/admin"

interface AdminSubscriptionRow {
  id: string
  user_id: string
  provider_customer_id: string | null
  provider_subscription_id: string | null
  stripe_price_id: string | null
  plan: string | null
  status: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  created_at: string
  profile: {
    email: string | null
    full_name: string | null
  } | null
}

export default async function AdminSubscriptionsPage() {
  const supabaseAdmin = createAdminClient()

  // Query subscriptions joined with member profile details using exact foreign key constraint
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      user_id,
      provider_customer_id,
      provider_subscription_id,
      stripe_price_id,
      plan,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      profile:profiles!subscriptions_user_id_fkey (
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })

  const subList = (subscriptions as unknown as AdminSubscriptionRow[]) || []

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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Subscription Query Error</AlertTitle>
          <AlertDescription className="text-xs">
            Failed to retrieve subscription records: {error.message}
          </AlertDescription>
        </Alert>
      )}

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
          {error ? (
            <div className="py-8 text-center text-xs text-destructive">
              Could not load subscriptions due to a database error. Check server logs.
            </div>
          ) : subList.length === 0 ? (
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
                    <TableHead>Stripe Customer / Sub</TableHead>
                    <TableHead>Renewal / End</TableHead>
                    <TableHead>Cancellation State</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subList.map((sub) => {
                    const profile = sub.profile
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
                              {profile?.email || sub.user_id}
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
                                : sub.status === "cancelled"
                                ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sub.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                          <div className="flex flex-col">
                            <span title="Stripe Customer ID">
                              {sub.provider_customer_id || "—"}
                            </span>
                            <span className="text-[10px] opacity-75" title="Stripe Subscription ID">
                              {sub.provider_subscription_id || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sub.current_period_end
                            ? new Date(sub.current_period_end).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {sub.cancel_at_period_end ? (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                              Cancels At Period End
                            </Badge>
                          ) : isActive ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                              Auto-Renews
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
