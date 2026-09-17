"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  MailCheck,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  User,
  KeyRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { signupSchema, type SignupInput } from "@/lib/validators/auth"
import { createClient } from "@/lib/supabase/client"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

type AccountType = "member" | "admin"

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get("role") === "admin" ? "admin" : "member"

  const [accountType, setAccountType] = React.useState<AccountType>(initialRole)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSuccessConfirmation, setIsSuccessConfirmation] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState("")
  const [adminCode, setAdminCode] = React.useState("")
  const [adminCodeError, setAdminCodeError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
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

  const handleAccountTypeChange = (newType: AccountType) => {
    setAccountType(newType)
    setErrorMessage(null)
    setAdminCodeError(null)
    if (newType === "admin") {
      setValue("email", "")
    }
  }

  const onSubmit = async (data: SignupInput) => {
    setErrorMessage(null)
    setAdminCodeError(null)

    // 1. Admin Registration Flow
    if (accountType === "admin") {
      if (!adminCode.trim()) {
        setAdminCodeError("Admin authorization code is required.")
        return
      }

      try {
        const response = await fetch("/api/auth/admin-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: data.fullName.trim(),
            email: data.email.trim(),
            password: data.password,
            adminCode: adminCode.trim(),
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          setErrorMessage(result.error || "Failed to register administrator account.")
          return
        }

        // Successfully registered admin
        router.push("/login?admin=registered")
      } catch {
        setErrorMessage("An unexpected network error occurred. Please try again.")
      }
      return
    }

    // 2. Member (Subscriber) Registration Flow
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
        setRegisteredEmail(data.email)
        setIsSuccessConfirmation(true)
      } else if (authData.session) {
        router.push("/dashboard")
        router.refresh()
      } else {
        router.push("/login?signup=success")
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.")
    }
  }

  const isAdmin = accountType === "admin"

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

        <Card
          className={`shadow-lg transition-all duration-300 ${
            isAdmin
              ? "border-amber-500/40 bg-card/95 shadow-amber-500/5 ring-1 ring-amber-500/20"
              : "border-border/60"
          }`}
        >
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="flex items-center justify-center">
              {isAdmin ? (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                >
                  <ShieldCheck className="size-3.5 text-amber-600 dark:text-amber-400" />
                  Restricted Administrator Onboarding
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground"
                >
                  <User className="size-3.5 text-primary" />
                  New Member Registration
                </Badge>
              )}
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">
              {isAdmin ? "Admin Registration" : "Create your account"}
            </CardTitle>
            <CardDescription className="text-sm">
              {isAdmin
                ? "Onboard a platform administrator account with executive authorization"
                : "Register for your monthly golf draw and verified charity contribution pool"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Account Type Selector (Dropdown & Checkbox Showcase) */}
            <div className="mb-5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signupAccountType" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Type:
                  </Label>
                  <NativeSelect
                    id="signupAccountType"
                    value={accountType}
                    onChange={(e) =>
                      handleAccountTypeChange(e.target.value as AccountType)
                    }
                    size="sm"
                    className="w-44 text-xs font-medium"
                  >
                    <NativeSelectOption value="member">
                      👤 Member (User)
                    </NativeSelectOption>
                    <NativeSelectOption value="admin">
                      🛡️ Administrator
                    </NativeSelectOption>
                  </NativeSelect>
                </div>

                {/* Checkbox alternative selector */}
                <div className="flex items-center space-x-2 pt-1 border-t border-border/40">
                  <Checkbox
                    id="adminSignupCheckbox"
                    checked={isAdmin}
                    onCheckedChange={(checked) =>
                      handleAccountTypeChange(checked ? "admin" : "member")
                    }
                  />
                  <label
                    htmlFor="adminSignupCheckbox"
                    className="text-xs font-medium cursor-pointer text-muted-foreground select-none"
                  >
                    Register as Platform Administrator
                  </label>
                </div>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="size-4" />
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Member Mode: Google Sign Up */}
            {!isAdmin ? (
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
            ) : (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Executive Clearance Notice</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80">
                  Administrator accounts oversee draw engines, winner verifications, and financial settlements. Registration requires a designated executive authorization code.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={isAdmin ? "e.g. Administrator Name" : "e.g. Rory McIlroy"}
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
                <Label htmlFor="email">
                  {isAdmin ? "Administrator Email" : "Email address"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isAdmin ? "admin@scorekind.in" : "you@example.com"}
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

              {/* Admin Authorization Code (Only in Admin Mode) */}
              {isAdmin && (
                <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminCode" className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Admin Authorization Code
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Key: ScoreKindAdmin2026
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="Enter executive authorization key"
                      value={adminCode}
                      onChange={(e) => {
                        setAdminCode(e.target.value)
                        setAdminCodeError(null)
                      }}
                      disabled={isSubmitting}
                      className="pr-10 font-mono text-sm border-amber-500/30"
                    />
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-amber-600 dark:text-amber-400 pointer-events-none" />
                  </div>
                  {adminCodeError ? (
                    <p className="text-xs text-destructive font-medium">
                      {adminCodeError}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Use the platform authorization key to approve administrative account creation.
                    </p>
                  )}
                </div>
              )}

              {!isAdmin && (
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
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold shadow-sm transition-colors ${
                  isAdmin
                    ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                    : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {isAdmin ? "Verifying & Creating Admin..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {isAdmin ? (
                      <ShieldCheck className="mr-2 size-4" />
                    ) : (
                      <HeartHandshake className="mr-2 size-4" />
                    )}
                    {isAdmin ? "Register Administrator Account" : "Create Account"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={isAdmin ? "/login?role=admin" : "/login"}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {isAdmin ? "Sign In as Admin" : "Sign In"}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}

export default function SignupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignupForm />
    </React.Suspense>
  )
}
