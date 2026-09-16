"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  MailCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { signupSchema, type SignupInput } from "@/lib/validators/auth"
import { createClient } from "@/lib/supabase/client"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSuccessConfirmation, setIsSuccessConfirmation] =
    React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: SignupInput) => {
    setErrorMessage(null)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (authData.user && !authData.session) {
        // Email confirmation is required by Supabase Auth configuration
        setRegisteredEmail(data.email)
        setIsSuccessConfirmation(true)
      } else if (authData.session) {
        // Automatic login enabled
        router.push("/dashboard")
        router.refresh()
      } else {
        router.push("/login?signup=success")
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.")
    }
  }

  if (isSuccessConfirmation) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-border/60 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <MailCheck className="size-7" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Verify your email
            </CardTitle>
            <CardDescription className="text-sm">
              We have sent a verification link to{" "}
              <span className="font-semibold text-foreground">
                {registeredEmail}
              </span>
              . Please check your inbox and verify your email to activate your
              ScoreKind membership.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full"
              render={<Link href="/login" />}
            >
              Return to Sign In
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive an email? Check your spam folder or try signing
              in to resend.
            </p>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center"
            aria-label="ScoreKind Home"
          >
            <Image
              src="/Logo/logo_light.svg"
              alt="ScoreKind"
              width={220}
              height={56}
              priority
              className="block h-12 w-auto dark:hidden"
            />
            <Image
              src="/Logo/logo_dark.svg"
              alt="ScoreKind"
              width={220}
              height={56}
              priority
              className="hidden h-12 w-auto dark:block"
            />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Join ScoreKind — Score. Win. Give Back.
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an account
            </CardTitle>
            <CardDescription className="text-sm">
              Enter your details to begin tracking golf scores and giving back
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-5 space-y-4">
              <GoogleSignInButton
                label="Sign up with Google (Members)"
                onError={(err) => setErrorMessage(err)}
              />

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-border/60" />
                <span className="absolute bg-card px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Rory McIlroy"
                  autoComplete="name"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.fullName}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    aria-invalid={!!errors.confirmPassword}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-teal-800 dark:text-teal-300">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  <span>Secure Member Guarantee</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Your profile starts with a default subscriber role and
                  guarantees 10%+ charity contribution selection.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <HeartHandshake className="mr-2 size-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
