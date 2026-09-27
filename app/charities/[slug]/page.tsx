import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getCharityBySlug } from "@/lib/charities/queries"
import { getCurrentUser } from "@/lib/auth/get-current-user"
import { createClient } from "@/lib/supabase/server"

interface CharityProfilePageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: CharityProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const charity = await getCharityBySlug(slug, true)

  if (!charity) {
    return {
      title: "Charity Not Found | ScoreKind",
    }
  }

  return {
    title: `${charity.name} | Partner Charity | ScoreKind`,
    description:
      charity.description ||
      `Support ${charity.name} through your ScoreKind golf subscription. Allocate 10% to 100% of your monthly membership fee.`,
  }
}

export default async function CharityProfilePage({
  params,
}: CharityProfilePageProps) {
  const { slug } = await params

  // Check if current visitor is admin to allow previewing draft/inactive charities
  const user = await getCurrentUser()
  let isAdmin = false
  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    isAdmin = profile?.role === "admin"
  }

  const charity = await getCharityBySlug(slug, isAdmin)

  if (!charity) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          href="/charities"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Partner Causes</span>
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg">
        {/* Cover Banner */}
        <div className="relative h-48 w-full sm:h-64 bg-linear-to-r from-teal-900 via-teal-800 to-emerald-900 overflow-hidden">
          {charity.cover_url ? (
            <Image
              src={charity.cover_url}
              alt={`${charity.name} cover`}
              fill
              priority
              className="object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />
          )}

          {/* Status Badges Overlay */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {charity.featured && (
              <Badge className="border-teal-500/40 bg-teal-500/90 text-white backdrop-blur-xs font-semibold text-xs shadow-sm">
                <Sparkles className="mr-1 size-3" />
                Featured Partner
              </Badge>
            )}
            {charity.status !== "active" && (
              <Badge variant="outline" className="border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                {charity.status.toUpperCase()} (Admin Preview)
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Content Container */}
        <div className="relative px-6 pb-8 pt-0 sm:px-10 sm:pb-10">
          {/* Overlapping Logo */}
          <div className="-mt-16 sm:-mt-20 flex items-end justify-between gap-4 mb-6">
            <div className="flex size-24 sm:size-32 shrink-0 items-center justify-center rounded-3xl border-4 border-card bg-background text-teal-700 dark:text-teal-300 shadow-md overflow-hidden">
              {charity.logo_url ? (
                <Image
                  src={charity.logo_url}
                  alt={charity.name}
                  width={128}
                  height={128}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-12 sm:size-16" />
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              {charity.website_url && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={charity.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  className="rounded-full text-xs font-medium"
                >
                  <span>Official Website</span>
                  <ExternalLink className="ml-1.5 size-3.5" />
                </Button>
              )}

              <Button
                size="sm"
                render={<Link href={`/dashboard/charity?select=${charity.id}`} />}
                className="rounded-full bg-teal-700 hover:bg-teal-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700 text-xs font-semibold px-5 shadow-sm"
              >
                <HeartHandshake className="mr-1.5 size-4" />
                <span>Nominate This Cause</span>
              </Button>
            </div>
          </div>

          {/* Charity Titles */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {charity.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
              <span>Verified ScoreKind Charitable Partner</span>
              <span>•</span>
              <span>Slug: {charity.slug}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8 space-y-4">
            <h2 className="text-base font-bold text-foreground">
              About the Organization & Mission
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
              {charity.description ||
                "This accredited charitable partner works directly to create lasting grassroots impact and provide critical support to communities in need."}
            </p>
          </div>

          {/* Impact Mechanics Box */}
          <Card className="mt-8 border-teal-500/20 bg-teal-500/5">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-sm">
                <HeartHandshake className="size-4 text-teal-600 dark:text-teal-400" />
                <span>How Your ScoreKind Membership Supports This Cause</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                As a ScoreKind member, at least 10% of your subscription payment is
                allocated directly to your chosen partner. You can voluntarily increase your
                allocation percentage up to 100% inside your member dashboard. All
                allocations are transparently tracked in your personal giving ledger.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
