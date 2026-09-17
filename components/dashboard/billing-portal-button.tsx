"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BillingPortalButtonProps {
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
  label?: string
}

export function BillingPortalButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Manage Billing & Invoices",
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenPortal = async () => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to launch billing portal.")
      }

      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1 w-full">
      <Button
        variant={variant}
        size={size}
        disabled={loading}
        onClick={handleOpenPortal}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Connecting to Stripe...
          </>
        ) : (
          <>
            <span>{label}</span>
            <ExternalLink className="ml-1.5 size-3.5" />
          </>
        )}
      </Button>
      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}
