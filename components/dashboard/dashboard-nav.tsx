"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Target,
  Trophy,
  HeartHandshake,
  Gift,
  Settings,
} from "lucide-react"
import { cn } from "cn"

export const dashboardNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Scores",
    href: "/dashboard/scores",
    icon: Target,
    exact: false,
  },
  {
    title: "Draws",
    href: "/dashboard/draws",
    icon: Trophy,
    exact: false,
  },
  {
    title: "Charity",
    href: "/dashboard/charity",
    icon: HeartHandshake,
    exact: false,
  },
  {
    title: "Winnings",
    href: "/dashboard/winnings",
    icon: Gift,
    exact: false,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    exact: false,
  },
]

interface DashboardNavProps {
  onItemClick?: () => void
  className?: string
}

export function DashboardNav({ onItemClick, className }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1.5", className)}>
      {dashboardNavItems.map((item) => {
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
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
