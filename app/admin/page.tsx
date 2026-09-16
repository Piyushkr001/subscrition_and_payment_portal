import Link from "next/link"
import {
  Users,
  CreditCard,
  Trophy,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Administrator Console
            </h1>
            <Badge variant="destructive" className="text-xs">
              Root Level
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Platform governance, subscriber management, draw simulation, and
            charity verification.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/admin/users" />}
          >
            <Users className="mr-2 size-4" />
            Manage Users
          </Button>
        </div>
      </div>

      <Alert className="border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-300">
        <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
        <AlertTitle>Foundation Security Active</AlertTitle>
        <AlertDescription className="text-xs">
          Role-based access control (RBAC) and Row Level Security (RLS) are
          active on all 11 database tables. Normal subscribers cannot reach this
          console or modify their own role.
        </AlertDescription>
      </Alert>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Subscribers */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Total Members</CardTitle>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              Active subscriber profiles in Supabase
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full justify-between px-0 text-xs text-primary"
              render={<Link href="/admin/users" />}
            >
              <span>View User Roster</span>
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* 2. Subscriptions */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Subscriptions
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground">
              Active monthly/annual billing plans
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full justify-between px-0 text-xs text-primary"
              render={<Link href="/admin/subscriptions" />}
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* 3. Monthly Draws */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Draws</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Trophy className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-foreground">0 Scheduled</div>
            <p className="text-xs text-muted-foreground">
              Draft, simulated, or locked draw cycles
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full justify-between px-0 text-xs text-primary"
              render={<Link href="/admin/draws" />}
            >
              <span>Configure Draws</span>
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* 4. Partner Charities */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">
              Partner Charities
            </CardTitle>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <HeartHandshake className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-foreground">0 Listed</div>
            <p className="text-xs text-muted-foreground">
              Verified cause partners receiving 10%+
            </p>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full justify-between px-0 text-xs text-primary"
              render={<Link href="/admin/charities" />}
            >
              <span>Manage Charities</span>
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Winner Verifications</CardTitle>
            <CardDescription>
              Review handicap certificates and scorecards for draw match claims.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShieldCheck className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium">No pending claims</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Claims submitted by 3-match, 4-match, and 5-match winners will
              appear here.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Compliance & Auditing</CardTitle>
            <CardDescription>
              Draw seeds, snapshots, and charity remittance verification logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CheckCircle2 className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium">Audits Up to Date</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Immutable draw entry snapshots preserve draw integrity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
