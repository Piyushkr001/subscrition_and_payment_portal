"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  HeartHandshake,
  Search,
  Sparkles,
  ArrowRight,
  Building2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CharityRow } from "@/lib/charities/queries"

interface CharityDirectoryProps {
  charities: CharityRow[]
}

export function CharityDirectory({ charities }: CharityDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCharities = useMemo(() => {
    if (!searchQuery.trim()) return charities
    const q = searchQuery.toLowerCase().trim()
    return charities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    )
  }, [charities, searchQuery])

  const featuredCharities = useMemo(
    () => filteredCharities.filter((c) => c.featured),
    [filteredCharities]
  )

  const otherCharities = useMemo(
    () => filteredCharities.filter((c) => !c.featured),
    [filteredCharities]
  )

  return (
    <div className="space-y-12">
      {/* Search Bar */}
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search partner charities by name or cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-full border-border/80 bg-background shadow-xs focus-visible:ring-teal-500"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredCharities.length === 0 && (
        <Card className="border-border/60 py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Search className="size-6" />
            </div>
            <h3 className="text-lg font-semibold">No charities found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              We couldn&apos;t find any active partner charities matching &quot;{searchQuery}&quot;. Try adjusting your keywords.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-2 rounded-full"
            >
              Clear search filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Featured Section */}
      {featuredCharities.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Featured Partner Causes
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {featuredCharities.map((charity) => (
              <Card
                key={charity.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-teal-500/30 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-950/5 dark:hover:shadow-none"
              >
                {/* Top featured glow bar */}
                <div className="h-1.5 w-full bg-linear-to-r from-teal-600 via-emerald-500 to-teal-400" />

                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-teal-500/10 text-teal-700 dark:text-teal-300 overflow-hidden">
                      {charity.logo_url ? (
                        <Image
                          src={charity.logo_url}
                          alt={charity.name}
                          width={56}
                          height={56}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Building2 className="size-7" />
                      )}
                    </div>

                    <Badge className="border-teal-500/30 bg-teal-500/15 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                      Featured Partner
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      <Link href={`/charities/${charity.slug}`}>
                        {charity.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 mt-2 text-sm leading-relaxed">
                      {charity.description || "Dedicated partner cause empowering community wellness and athletic opportunity."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/charities/${charity.slug}`} />}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="ml-1 size-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    render={<Link href={`/dashboard/charity?select=${charity.id}`} />}
                    className="rounded-full bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-xs font-semibold px-4"
                  >
                    <HeartHandshake className="mr-1.5 size-3.5" />
                    <span>Select Cause</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Other Causes */}
      {otherCharities.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <HeartHandshake className="size-5 text-muted-foreground" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {featuredCharities.length > 0 ? "All Partner Causes" : "Active Partner Causes"}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherCharities.map((charity) => (
              <Card
                key={charity.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-border hover:shadow-lg"
              >
                <CardHeader className="space-y-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted text-muted-foreground overflow-hidden">
                    {charity.logo_url ? (
                      <Image
                        src={charity.logo_url}
                        alt={charity.name}
                        width={48}
                        height={48}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Building2 className="size-6" />
                    )}
                  </div>

                  <div>
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                      <Link href={`/charities/${charity.slug}`}>
                        {charity.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1.5 text-xs leading-relaxed">
                      {charity.description || "Verified partner cause eligible for member subscription contributions."}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardFooter className="flex items-center justify-between border-t border-border/60 pt-3 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/charities/${charity.slug}`} />}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <span>Details</span>
                    <ArrowRight className="ml-1 size-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/dashboard/charity?select=${charity.id}`} />}
                    className="rounded-full text-xs font-medium"
                  >
                    <HeartHandshake className="mr-1 size-3" />
                    <span>Select</span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
