"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  HeartHandshake,
  Menu,
  Trophy,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ModeToggle } from "./ModeToggle"
import { cn } from "cn"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

const navLinks = [
  {
    id: 1,
    title: "Home",
    url: "/",
  },
  {
    id: 2,
    title: "How It Works",
    url: "/#how-it-works",
  },
  {
    id: 3,
    title: "Charities",
    url: "/charities",
  },
  {
    id: 4,
    title: "Draws",
    url: "/draws",
  },
  {
    id: 5,
    title: "Pricing",
    url: "/#pricing",
  },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null
  }

  const isActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    if (url.startsWith("/#")) {
      return false
    }
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-border/50
        bg-background/80
        backdrop-blur-xl
        supports-backdrop-filter:bg-background/70
      "
    >
      <div
        className="
          mx-auto flex h-18 max-w-7xl
          items-center justify-between
          px-4 sm:px-6 lg:px-8
        "
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="ScoreKind Home"
        >
          <Image
            src="/Logo/logo_light.svg"
            alt="ScoreKind"
            width={300}
            height={72}
            priority
            className="block h-14 w-auto sm:h-16 dark:hidden"
          />

          <Image
            src="/Logo/logo_dark.svg"
            alt="ScoreKind"
            width={300}
            height={72}
            priority
            className="hidden h-14 w-auto sm:h-16 dark:block"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.url)
            return (
              <Button
                key={link.id}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                render={<Link href={link.url} />}
                className={cn(
                  "text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                {link.title}
              </Button>
            )
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <ModeToggle />

          {user ? (
            <Button
              render={<Link href="/dashboard" />}
              className="rounded-full px-6 shadow-sm transition-all hover:shadow-md"
            >
              <Trophy className="mr-2 size-4" />
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                render={<Link href="/login" />}
                className="rounded-full px-5"
              >
                Sign In
              </Button>

              <Button
                render={<Link href="/signup" />}
                className="
                  rounded-full px-6
                  shadow-sm
                  transition-all
                  hover:shadow-md
                "
              >
                <HeartHandshake className="mr-2 size-4" />
                Join ScoreKind
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 lg:hidden">
          <ModeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Open navigation menu"
                >
                  <Menu className="size-6" />
                </Button>
              }
            />

            <SheetContent
              side="right"
              className="
                flex w-[85%] flex-col
                sm:max-w-sm
              "
            >
              <SheetHeader className="border-b pb-5 text-left">
                <SheetTitle className="sr-only">
                  ScoreKind Navigation
                </SheetTitle>

                <SheetDescription className="sr-only">
                  Navigate through the ScoreKind platform.
                </SheetDescription>

                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="inline-flex"
                >
                  <Image
                    src="/Logo/logo_light.svg"
                    alt="ScoreKind"
                    width={190}
                    height={48}
                    className="block h-10 w-auto dark:hidden"
                  />

                  <Image
                    src="/Logo/logo_dark.svg"
                    alt="ScoreKind"
                    width={190}
                    height={48}
                    className="hidden h-10 w-auto dark:block"
                  />
                </Link>
              </SheetHeader>

              {/* Mobile Links */}
              <nav className="flex flex-1 flex-col gap-2 py-6">
                {navLinks.map((link) => {
                  const active = isActive(link.url)
                  return (
                    <Button
                      key={link.id}
                      variant={active ? "secondary" : "ghost"}
                      render={
                        <Link
                          href={link.url}
                          onClick={() => setOpen(false)}
                        />
                      }
                      className={cn(
                        "h-12 justify-start rounded-xl px-4 text-base font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                      )}
                    >
                      {link.title}
                    </Button>
                  )
                })}
              </nav>

              {/* Mobile Highlight */}
              <div
                className="
                  mb-5 rounded-2xl
                  border border-primary/10
                  bg-primary/5 p-4
                "
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="
                      flex size-10 items-center
                      justify-center rounded-xl
                      bg-primary/10
                      text-primary
                    "
                  >
                    <Trophy className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Play with purpose
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Score. Win. Give Back.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="space-y-3 border-t pt-5">
                {user ? (
                  <Button
                    className="h-11 w-full rounded-xl"
                    render={
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                      >
                        <Trophy className="mr-2 size-4" />
                        Dashboard
                      </Link>
                    }
                  >
                    <Trophy className="mr-2 size-4" />
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl"
                      render={
                        <Link
                          href="/login"
                          onClick={() => setOpen(false)}
                        />
                      }
                    >
                      Sign In
                    </Button>

                    <Button
                      className="h-11 w-full rounded-xl"
                      render={
                        <Link
                          href="/signup"
                          onClick={() => setOpen(false)}
                        >
                          <HeartHandshake className="mr-2 size-4" />
                          Join ScoreKind
                        </Link>
                      }
                    >
                      <HeartHandshake className="mr-2 size-4" />
                      Join ScoreKind
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar