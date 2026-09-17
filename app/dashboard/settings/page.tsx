import Link from "next/link"
import { Shield, CreditCard, ArrowRight } from "lucide-react"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { getUserSubscription } from "@/lib/scores/subscription-check"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button"

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()
  const subscription = user ? await getUserSubscription(user.id) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile and subscription preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Details */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Your personal information stored securely in PostgreSQL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                defaultValue={
                  profile?.full_name || user?.user_metadata?.full_name || ""
                }
                disabled
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input defaultValue={profile?.email || user?.email || ""} disabled />
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Role</Label>
              <div>
                <Badge variant="outline" className="text-xs uppercase">
                  {profile?.role || "subscriber"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Billing Details */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <span>Subscription & Billing</span>
            </CardTitle>
            <CardDescription>
              Manage your ScoreKind membership tier and Stripe payment methods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Plan Status
              </span>
              <Badge
                variant={subscription?.isActive ? "default" : "secondary"}
                className={`text-[11px] uppercase ${
                  subscription?.isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : ""
                }`}
              >
                {subscription?.isActive
                  ? `${subscription.plan || "Active"} Plan`
                  : subscription?.status || "Inactive"}
              </Badge>
            </div>

            {subscription?.isActive && subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? "Cancels On" : "Next Renewal"}
                </span>
                <span className="font-semibold text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="pt-2">
              {subscription?.providerCustomerId ? (
                <BillingPortalButton
                  variant="default"
                  className="w-full justify-center bg-primary text-primary-foreground font-semibold"
                  label="Open Stripe Customer Portal"
                />
              ) : (
                <Button
                  className="w-full justify-center font-semibold"
                  render={<Link href="/#pricing" />}
                >
                  <span>Select a Membership Plan</span>
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Update payment methods, view invoices, or modify cancellation settings in Stripe&apos;s secure portal.
            </p>
          </CardContent>
        </Card>

        {/* Security & RBAC Card */}
        <Card className="border-border/60 md:col-span-2">
          <CardHeader>
            <CardTitle>Security & RBAC</CardTitle>
            <CardDescription>
              Protected identity and authorization verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Shield className="size-4 text-teal-600 dark:text-teal-400" />
                <span>Zero-Trust Role Architecture</span>
              </div>
              <p className="text-muted-foreground">
                Your role is enforced server-side by PostgreSQL Row Level
                Security (RLS) and database triggers. Client-side role tampering
                is prevented.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
