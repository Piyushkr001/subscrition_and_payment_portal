"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface GoogleSignInButtonProps {
  label?: string
  className?: string
  onError?: (error: string) => void
}

const emptySubscribe = () => () => {}

function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

/**
 * Official Google 'G' brand mark SVG matching Google Identity Branding Guidelines.
 */
function GoogleLogoSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className || "size-4"}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  label = "Continue with Google",
  className,
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [loading, setLoading] = React.useState(false)
  const [gisFailed, setGisFailed] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [buttonWidth, setButtonWidth] = React.useState(350)

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()

  // Google Identity Services button width must be between 200px and 400px
  React.useEffect(() => {
    if (containerRef.current) {
      const measured = containerRef.current.offsetWidth
      if (measured > 0) {
        // Clamp to Google GSI constraints: min 200, max 400
        const clamped = Math.min(400, Math.max(200, measured))
        setButtonWidth(clamped)
      }
    }
  }, [mounted])

  // 1. Handle Supabase OAuth redirect flow (the most reliable flow)
  const handleOAuthSignIn = React.useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/dashboard`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        setLoading(false)
        const friendlyMessage =
          error.message.includes("not enabled") || error.message.includes("Provider")
            ? "Google provider is not enabled in your Supabase project. Please enable Google in Supabase Dashboard → Authentication → Providers."
            : error.message
        onError?.(friendlyMessage)
      } else if (data?.url) {
        window.location.href = data.url
      }
    } catch {
      setLoading(false)
      onError?.("Could not initialize Google authentication. Please try again.")
    }
  }, [onError])

  // 2. Handle ID token from official @react-oauth/google library
  const handleIdTokenSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.("No Google credential received. Falling back to standard Google sign-in...")
      await handleOAuthSignIn()
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credentialResponse.credential,
      })

      if (error) {
        console.warn(
          "Supabase signInWithIdToken returned an error:",
          error.message
        )

        // If Google provider is not enabled on the Supabase backend at all:
        if (error.message.includes("not enabled") || error.message.includes("Provider")) {
          setLoading(false)
          onError?.(
            "Google provider is not enabled in your Supabase project. Please enable Google in Supabase Dashboard → Authentication → Providers."
          )
          return
        }

        // Otherwise try standard OAuth redirect
        await handleOAuthSignIn()
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      console.warn("Google token exchange error, falling back to OAuth redirect.")
      await handleOAuthSignIn()
    }
  }

  // If NEXT_PUBLIC_GOOGLE_CLIENT_ID is provided and GIS hasn't failed, render official Google button
  if (mounted && googleClientId && !gisFailed) {
    return (
      <div ref={containerRef} className={`relative flex w-full flex-col items-center justify-center ${className || ""}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-xs">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}
        <GoogleOAuthProvider clientId={googleClientId}>
          <div className="flex w-full justify-center [&>div]:mx-auto">
            <GoogleLogin
              onSuccess={handleIdTokenSuccess}
              onError={() => {
                console.warn(
                  "Google Identity Services failed to load or origin is not allowed. Switching to standard OAuth."
                )
                setGisFailed(true)
              }}
              useOneTap={false}
              theme="outline"
              size="large"
              shape="rectangular"
              text="continue_with"
              width={buttonWidth.toString()}
            />
          </div>
        </GoogleOAuthProvider>
      </div>
    )
  }

  // Standard Fallback: Google-branded button calling Supabase Auth signInWithOAuth
  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={handleOAuthSignIn}
      className={`relative w-full border-border/80 bg-background font-medium hover:bg-muted/60 ${className || ""}`}
    >
      {loading ? (
        <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" />
      ) : (
        <GoogleLogoSvg className="mr-2 size-4" />
      )}
      <span>{label}</span>
    </Button>
  )
}
