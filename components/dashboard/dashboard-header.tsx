"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, LogOut, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ModeToggle } from "@/app/_shared/ModeToggle"
import { DashboardNav } from "./dashboard-nav"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"
import type { User } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: User
  profile: Profile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || "Subscriber"
  const displayEmail = profile?.email || user.email || ""
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch {
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Navigation Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            }
          />

          <SheetContent side="left" className="flex w-72 flex-col p-5">
            <SheetHeader className="border-b pb-4 text-left">
              <SheetTitle className="sr-only">ScoreKind Dashboard Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate your subscriber dashboard
              </SheetDescription>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center"
              >
                <Image
                  src="/Logo/logo_light.svg"
                  alt="ScoreKind"
                  width={160}
                  height={40}
                  className="block h-9 w-auto dark:hidden"
                />
                <Image
                  src="/Logo/logo_dark.svg"
                  alt="ScoreKind"
                  width={160}
                  height={40}
                  className="hidden h-9 w-auto dark:block"
                />
              </Link>
            </SheetHeader>

            <div className="flex-1 py-4">
              <DashboardNav onItemClick={() => setOpen(false)} />
            </div>

            {profile?.role === "admin" && (
              <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-semibold text-destructive">
                  Admin Privileges
                </p>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center gap-1.5 text-xs text-primary underline"
                >
                  <ShieldAlert className="size-3.5" />
                  Switch to Admin Console
                </Link>
              </div>
            )}

            <div className="border-t pt-4">
              <Button
                variant="outline"
                onClick={handleSignOut}
                disabled={loggingOut}
                className="w-full justify-start gap-2"
              >
                <LogOut className="size-4" />
                <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Brand Logo */}
        <Link href="/dashboard" className="flex items-center lg:hidden">
          <Image
            src="/Logo/logo_light.svg"
            alt="ScoreKind"
            width={140}
            height={36}
            className="block h-8 w-auto dark:hidden"
          />
          <Image
            src="/Logo/logo_dark.svg"
            alt="ScoreKind"
            width={140}
            height={36}
            className="hidden h-8 w-auto dark:block"
          />
        </Link>
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-3">
        {profile?.role === "admin" && (
          <Button
            size="xs"
            variant="outline"
            className="hidden text-xs text-destructive hover:bg-destructive/10 sm:inline-flex"
            render={<Link href="/admin" />}
          >
            <ShieldAlert className="mr-1 size-3.5" />
            Admin Console
          </Button>
        )}

        <ModeToggle />

        <div className="hidden h-5 w-px bg-border sm:block" />

        <div className="flex items-center gap-3">
          <Avatar size="default" className="size-8 sm:size-9">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold leading-none text-foreground">
                {displayName}
              </span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {profile?.role === "admin" ? "Admin" : "Subscriber"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-40">
              {displayEmail}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-foreground"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
