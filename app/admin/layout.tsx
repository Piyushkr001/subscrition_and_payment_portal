import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { requireAdmin } from "@/lib/auth/require-admin"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminHeader } from "@/components/admin/admin-header"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Strict server-side verification: requires authenticated JWT session AND profile.role === 'admin'
  const { user, profile } = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-6">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/Logo/logo_light.svg"
              alt="ScoreKind"
              width={140}
              height={36}
              priority
              className="block h-8 w-auto dark:hidden"
            />
            <Image
              src="/Logo/logo_dark.svg"
              alt="ScoreKind"
              width={140}
              height={36}
              priority
              className="hidden h-8 w-auto dark:block"
            />
          </Link>
          <Badge
            variant="destructive"
            className="text-[10px] font-bold tracking-wide uppercase"
          >
            Admin
          </Badge>
        </div>

        {/* Navigation links */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <AdminNav />

          {/* Admin Security Badge */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl border border-border/60 p-3 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Subscriber View</span>
            </Link>

            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <ShieldCheck className="size-4" />
                <span>Privileged Console</span>
              </div>
              <p className="mt-1 text-muted-foreground text-[11px]">
                Actions taken in this console are executed under elevated role
                permissions.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <AdminHeader user={user} profile={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
