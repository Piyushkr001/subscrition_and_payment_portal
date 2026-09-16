"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HeartHandshake, ShieldCheck } from "lucide-react"

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  const isAdminShell =
    pathname === "/admin" ||
    (pathname?.startsWith("/admin/") && !pathname?.startsWith("/admin-register"))

  if (pathname?.startsWith("/dashboard") || isAdminShell) {
    return null
  }

  const platformLinks = [
    { title: "How It Works", href: "/#how-it-works" },
    { title: "Monthly Draws", href: "/draws" },
    { title: "Membership Plans", href: "/#pricing" },
    { title: "Stableford Scoring", href: "/#how-it-works" },
  ]

  const impactLinks = [
    { title: "Partner Charities", href: "/charities" },
    { title: "Our Giving Model", href: "/charities#giving" },
    { title: "Community Reports", href: "/charities#reports" },
    { title: "Nominate a Cause", href: "/charities#nominate" },
  ]

  const accountLinks = [
    { title: "Sign In", href: "/login" },
    { title: "Create Account", href: "/signup" },
    { title: "Member Dashboard", href: "/dashboard" },
    { title: "Score Entry", href: "/dashboard/scores" },
  ]

  const legalLinks = [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Draw Regulations", href: "/rules" },
    { title: "Cookie Policy", href: "/cookies" },
  ]

  return (
    <footer className="border-t border-border/60 bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        {/* Main Footer Content Grid using Flexbox */}
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          {/* Brand Column */}
          <div className="flex max-w-sm flex-col">
            <Link href="/" className="inline-flex items-center" aria-label="ScoreKind Home">
              <Image
                src="/Logo/logo_light.svg"
                alt="ScoreKind"
                width={220}
                height={56}
                className="block h-11 w-auto dark:hidden"
              />
              <Image
                src="/Logo/logo_dark.svg"
                alt="ScoreKind"
                width={220}
                height={56}
                className="hidden h-11 w-auto dark:block"
              />
            </Link>

            <p className="mt-4 text-sm font-semibold text-foreground">
              Score. Win. Give Back.
            </p>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A modern golf performance tracking and charitable giving platform.
              Track your Stableford game, enter monthly prize draws, and make a
              guaranteed charitable impact with every membership.
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-teal-500/20 bg-teal-500/5 px-3.5 py-2 text-xs font-medium text-teal-800 dark:text-teal-300">
              <HeartHandshake className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>Guaranteed 10%+ minimum donation to verified causes</span>
            </div>
          </div>

          {/* Nav Columns Container */}
          <div className="flex flex-1 flex-wrap gap-8 sm:gap-12 lg:justify-end">
            {/* Platform Column */}
            <div className="min-w-35">
              <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                Platform
              </h3>
              <ul className="mt-4 space-y-2.5">
                {platformLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impact Column */}
            <div className="min-w-35">
              <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                Impact
              </h3>
              <ul className="mt-4 space-y-2.5">
                {impactLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account Column */}
            <div className="min-w-35">
              <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                Account
              </h3>
              <ul className="mt-4 space-y-2.5">
                {accountLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Column */}
            <div className="min-w-35">
              <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-2.5">
                {legalLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-12 border-t border-border/50 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © {currentYear} ScoreKind. All rights reserved. Score. Win. Give Back.
            </p>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
              <span>Independent Audited Draw System · Verified Charity Remittance</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer