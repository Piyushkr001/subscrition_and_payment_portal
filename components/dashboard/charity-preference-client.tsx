"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Building2,
  AlertCircle,
  ExternalLink,
  History,
  Coins,
  ChevronRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  charityPreferenceSchema,
  type CharityPreferenceInput,
} from "@/lib/validators/charity"
import { updateUserCharityPreferenceAction } from "@/lib/charities/actions"
import type {
  CharityRow,
  EnrichedCharityPreference,
  EnrichedCharityContribution,
} from "@/lib/charities/queries"

interface CharityPreferenceClientProps {
  initialPreference: EnrichedCharityPreference | null
  activeCharities: CharityRow[]
  contributions: EnrichedCharityContribution[]
  totalAllocated: number
  preselectedCharityId?: string
}

export function CharityPreferenceClient({
  initialPreference,
  activeCharities,
  contributions,
  totalAllocated,
  preselectedCharityId,
}: CharityPreferenceClientProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Default charity: preselected, or initial preference, or first active charity
  const defaultCharityId =
    preselectedCharityId ||
    initialPreference?.charity_id ||
    activeCharities[0]?.id ||
    ""

  const defaultPercentage = initialPreference?.contribution_percentage ?? 10

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CharityPreferenceInput>({
    resolver: zodResolver(charityPreferenceSchema),
    defaultValues: {
      charityId: defaultCharityId,
      contributionPercentage: defaultPercentage,
    },
  })

  const selectedCharityId = watch("charityId")
  const currentPercentage = watch("contributionPercentage")

  const selectedCharity = activeCharities.find((c) => c.id === selectedCharityId)

  const onSubmit = (data: CharityPreferenceInput) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateUserCharityPreferenceAction(data)
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || "Charity preference updated successfully.",
        })
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to update preference.",
        })
      }
    })
  }

  return (
    <div className="space-y-10">
      {/* Informational Callout */}
      <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <ShieldCheck className="size-5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">
            Enforced Giving Guarantee:
          </span>{" "}
          ScoreKind automatically allocates a minimum of 10% of your membership
          subscription to your nominated partner cause. This is a{" "}
          <strong className="text-foreground">charitable allocation preference</strong> recorded
          in your member ledger with every successful invoice.
        </div>
      </div>

      {feedback && (
        <Alert
          className={
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4 text-destructive" />
          )}
          <AlertDescription className="font-medium text-xs sm:text-sm">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Preference Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column (2 Cols): Charity Picker */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  1. Nominate Partner Cause
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select which accredited charitable partner should receive your allocations.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/charities" target="_blank" />}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <span>Directory</span>
                <ExternalLink className="ml-1 size-3" />
              </Button>
            </div>

            {errors.charityId && (
              <p className="text-xs font-semibold text-destructive">
                {errors.charityId.message}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {activeCharities.map((charity) => {
                const isSelected = selectedCharityId === charity.id
                return (
                  <div
                    key={charity.id}
                    onClick={() => setValue("charityId", charity.id, { shouldValidate: true })}
                    className={`cursor-pointer group relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-500/10 shadow-sm dark:border-teal-400"
                        : "border-border/70 bg-card hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background text-teal-700 dark:text-teal-300 overflow-hidden">
                          {charity.logo_url ? (
                            <Image
                              src={charity.logo_url}
                              alt={charity.name}
                              width={40}
                              height={40}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Building2 className="size-5" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {charity.featured && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0.5 bg-teal-500/20 text-teal-800 dark:text-teal-300"
                            >
                              Featured
                            </Badge>
                          )}
                          <div
                            className={`flex size-5 items-center justify-center rounded-full border transition-colors ${
                              isSelected
                                ? "border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-slate-900"
                                : "border-muted-foreground/30 bg-background"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="size-3.5" />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                          {charity.name}
                        </h3>
                        <p className="line-clamp-2 mt-1 text-xs text-muted-foreground leading-relaxed">
                          {charity.description || "Accredited partner organization."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                      <Link
                        href={`/charities/${charity.slug}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>Learn more</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column (1 Col): Percentage Slider & Summary */}
          <div className="space-y-6">
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold">
                  2. Contribution Percentage
                </CardTitle>
                <CardDescription className="text-xs">
                  Minimum 10% · Maximum 100%
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Big Percentage Display */}
                <div className="flex items-center justify-between rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Selected Pledge
                    </span>
                    <p className="text-3xl font-black text-foreground">
                      {currentPercentage}%
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950">
                    <HeartHandshake className="size-5" />
                  </div>
                </div>

                {/* Slider Control */}
                <div className="space-y-3">
                  <Controller
                    control={control}
                    name="contributionPercentage"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Slider
                          min={10}
                          max={100}
                          step={1}
                          onValueChange={(val) => {
                            const n = Array.isArray(val) ? val[0] : typeof val === "number" ? val : 10
                            field.onChange(n)
                          }}
                          className="py-2"
                        />
                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span>10% (Min)</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>100% (Max)</span>
                        </div>
                      </div>
                    )}
                  />
                  {errors.contributionPercentage && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.contributionPercentage.message}
                    </p>
                  )}
                </div>

                {/* Direct Number Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Or enter exact percentage:
                  </label>
                  <Controller
                    control={control}
                    name="contributionPercentage"
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={10}
                        max={100}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-9 text-xs"
                      />
                    )}
                  />
                </div>

                {/* Summary Box */}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 text-xs">
                  <span className="font-semibold text-foreground">
                    Selected Cause:
                  </span>
                  <p className="text-muted-foreground font-medium">
                    {selectedCharity ? selectedCharity.name : "None selected"}
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    Applied automatically to all future subscription billing cycles.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isPending || !selectedCharityId}
                  className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-teal-600 dark:hover:bg-teal-700 font-semibold"
                >
                  {isPending ? "Saving Preference..." : "Save Preference"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>

      {/* Contribution Allocation Ledger */}
      <div className="space-y-4 pt-6 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-lg font-bold text-foreground">
                Your Contribution Allocation Ledger
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Traceable records of subscription allocations generated from verified Stripe payments.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border/70 bg-card px-3.5 py-1.5 text-xs font-semibold">
            <Coins className="size-4 text-teal-600 dark:text-teal-400" />
            <span>Total Allocated: ₹{totalAllocated.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {contributions.length === 0 ? (
          <Card className="border-border/60 py-10 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <History className="size-5" />
              </div>
              <h4 className="text-sm font-semibold">No allocations recorded yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                As soon as your monthly or annual subscription renewal is processed, your
                allocated contribution ledger will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Partner Charity</TableHead>
                  <TableHead className="text-xs font-semibold">Pledge %</TableHead>
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Ledger Status</TableHead>
                  <TableHead className="text-xs font-semibold">Invoice Ref</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium">
                      {new Date(c.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {c.charity?.name || "Partner Charity"}
                    </TableCell>
                    <TableCell className="text-xs">{c.percentage}%</TableCell>
                    <TableCell className="text-xs font-bold text-teal-700 dark:text-teal-300">
                      {c.currency.toUpperCase()} {Number(c.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/20"
                      >
                        Allocation Recorded
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {c.provider_invoice_id
                        ? `${c.provider_invoice_id.slice(0, 14)}...`
                        : "Direct"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
