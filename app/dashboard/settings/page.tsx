import { getCurrentProfile } from "@/lib/auth/get-current-profile"
import { getCurrentUser } from "@/lib/auth/get-current-user"
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
import { Shield } from "lucide-react"

export default async function DashboardSettingsPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentProfile()

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

        <Card className="border-border/60">
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
