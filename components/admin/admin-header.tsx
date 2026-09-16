"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, LogOut, ArrowLeft } from "lucide-react"

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
import { AdminNav } from "./admin-nav"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"
import type { User } from "@supabase/supabase-js"

interface AdminHeaderProps {
  user: User
  profile: Profile
}

export function AdminHeader({ user, profile }: AdminHeaderProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loggingOut, setLoggingOut] = React.useState(false)

  const displayName = profile.full_name || user.email || "Administrator"
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
                aria-label="Open admin navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            }
          />

          <SheetContent side="left" className="flex w-72 flex-col p-5">
            <SheetHeader className="border-b pb-4 text-left">
              <SheetTitle className="sr-only">ScoreKind Admin Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Administer the ScoreKind platform
              </SheetDescription>
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center"
                >
                  <Image
                    src="/Logo/logo_light.svg"
                    alt="ScoreKind"
                    width={150}
                    height={38}
                    className="block h-8 w-auto dark:hidden"
                  />
                  <Image
                    src="/Logo/logo_dark.svg"
                    alt="ScoreKind"
                    width={150}
                    height={38}
                    className="hidden h-8 w-auto dark:block"
                  />
                </Link>
                <Badge variant="destructive" className="text-[10px]">
                  Admin
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 py-4">
              <AdminNav onItemClick={() => setOpen(false)} />
            </div>

            <div className="space-y-3 border-t pt-4">
              <Button
                variant="outline"
                render={<Link href="/dashboard" />}
                className="w-full justify-start gap-2 text-xs"
              >
                <ArrowLeft className="size-3.5" />
                Subscriber Dashboard
              </Button>

              <Button
                variant="ghost"
                onClick={handleSignOut}
                disabled={loggingOut}
                className="w-full justify-start gap-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-3.5" />
                <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Brand with Admin indicator */}
        <div className="flex items-center gap-2">
          <Link href="/admin" className="flex items-center lg:hidden">
            <Image
              src="/Logo/logo_light.svg"
              alt="ScoreKind"
              width={130}
              height={34}
              className="block h-7 w-auto dark:hidden"
            />
            <Image
              src="/Logo/logo_dark.svg"
              alt="ScoreKind"
              width={130}
              height={34}
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
          <Badge
            variant="destructive"
            className="text-[10px] font-bold tracking-wider uppercase"
          >
            Admin Console
          </Badge>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="xs"
          className="hidden gap-1.5 text-xs sm:inline-flex"
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft className="size-3.5" />
          <span>Subscriber View</span>
        </Button>

        <ModeToggle />

        <div className="hidden h-5 w-px bg-border sm:block" />

        <div className="flex items-center gap-3">
          <Avatar size="default" className="size-8 ring-2 ring-destructive/30 sm:size-9">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-destructive/10 text-xs font-bold text-destructive">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col sm:flex">
            <span className="text-xs font-semibold leading-none text-foreground">
              {displayName}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-40">
              {user.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="text-muted-foreground hover:text-destructive"
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
