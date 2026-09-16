"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  HeartHandshake,
  Award,
  BarChart3,
} from "lucide-react"
import { cn } from "cn"

export const adminNavItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    exact: false,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    exact: false,
  },
  {
    title: "Draws",
    href: "/admin/draws",
    icon: Trophy,
    exact: false,
  },
  {
    title: "Charities",
    href: "/admin/charities",
    icon: HeartHandshake,
    exact: false,
  },
  {
    title: "Winners & Claims",
    href: "/admin/winners",
    icon: Award,
    exact: false,
  },
  {
    title: "Reports & Audits",
    href: "/admin/reports",
    icon: BarChart3,
    exact: false,
  },
]

interface AdminNavProps {
  onItemClick?: () => void
  className?: string
}

export function AdminNav({ onItemClick, className }: AdminNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1.5", className)}>
      {adminNavItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-destructive/10 text-destructive font-semibold"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-destructive" : "text-muted-foreground"
              )}
            />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
