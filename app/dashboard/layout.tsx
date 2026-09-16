import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { requireUser } from "@/lib/auth/require-user"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HeartHandshake } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side authentication guard: verifies session/JWT before rendering
  const { user, profile } = await requireUser("/login")

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-border/60 px-6">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/Logo/logo_light.svg"
              alt="ScoreKind"
              width={160}
              height={42}
              priority
              className="block h-9 w-auto dark:hidden"
            />
            <Image
              src="/Logo/logo_dark.svg"
              alt="ScoreKind"
              width={160}
              height={42}
              priority
              className="hidden h-9 w-auto dark:block"
            />
          </Link>
        </div>

        {/* Navigation links */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <DashboardNav />

          {/* Member Impact Card */}
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs">
            <div className="flex items-center gap-2 font-semibold text-teal-800 dark:text-teal-300">
              <HeartHandshake className="size-4 text-teal-600 dark:text-teal-400" />
              <span>Giving With Purpose</span>
            </div>
            <p className="mt-1.5 text-muted-foreground leading-relaxed">
              Every monthly membership contributes a minimum of 10% to your
              selected charity.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
