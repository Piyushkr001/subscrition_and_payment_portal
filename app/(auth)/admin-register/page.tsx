"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const adminRegisterFormSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .min(1, "Email address is required")
      .email("Please enter a valid email address")
      .refine(
        (email) => email.toLowerCase().includes("admin"),
        {
          message:
            'Admin email must contain the keyword "admin" (e.g. abc_admin@ScoreKind.in)',
        }
      ),
    password: z
      .string()
      .min(8, "Admin password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type AdminRegisterFormInput = z.infer<typeof adminRegisterFormSchema>

export default function AdminRegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  )

  const [quotaInfo, setQuotaInfo] = React.useState<{
    currentAdmins: number
    maxAdmins: number
    availableSlots: number
    canRegister: boolean
  } | null>(null)
  const [loadingQuota, setLoadingQuota] = React.useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterFormInput>({
    resolver: zodResolver(adminRegisterFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Fetch current admin quota status
  React.useEffect(() => {
    fetch("/api/auth/admin-register")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setQuotaInfo(data)
        }
      })
      .catch(() => {
        // Fallback default
      })
      .finally(() => {
        setLoadingQuota(false)
      })
  }, [])

  const onSubmit = async (data: AdminRegisterFormInput) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/auth/admin-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        setErrorMessage(
          result.error || "Failed to register administrator account"
        )
        return
      }

      setSuccessMessage(
        "Administrator account registered successfully! Redirecting to sign in..."
      )
      setTimeout(() => {
        router.push("/login?signup=success")
      }, 2000)
    } catch {
      setErrorMessage("Network error during administrator registration.")
    }
  }

  const isQuotaFull = quotaInfo !== null && !quotaInfo.canRegister

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
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <Badge variant="destructive" className="text-xs uppercase">
              Admin Provisioning
            </Badge>
          </div>
        </div>

        <Card className="border-destructive/30 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Admin Registration
            </CardTitle>
            <CardDescription className="text-xs">
              Restricted console: Maximum 3 administrators permitted. Email must
              contain the keyword &quot;admin&quot;.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Dynamic Quota Status Pill */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  System Quota:
                </span>
              </div>
              <div>
                {loadingQuota ? (
                  <span className="text-muted-foreground">Checking slots...</span>
                ) : quotaInfo ? (
                  <Badge
                    variant={quotaInfo.canRegister ? "secondary" : "destructive"}
                    className="text-[11px]"
                  >
                    {quotaInfo.availableSlots} of {quotaInfo.maxAdmins} slots
                    available
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Max 3 Admins</span>
                )}
              </div>
            </div>

            {/* Keyword Rule Banner */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
              <p className="font-semibold">Email Keyword Requirement:</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Only emails containing <span className="font-mono font-bold text-destructive">&quot;admin&quot;</span> are accepted (e.g. <span className="font-mono font-medium text-foreground">abc_admin@ScoreKind.in</span>).
              </p>
            </div>

            {successMessage && (
              <Alert className="border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-300">
                <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription className="text-xs">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Registration Denied</AlertTitle>
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {isQuotaFull ? (
              <Alert variant="destructive">
                <ShieldAlert className="size-4" />
                <AlertTitle>Admin Quota Full</AlertTitle>
                <AlertDescription className="text-xs">
                  All 3 administrator positions are currently assigned. No
                  further administrator accounts can be created.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. System Administrator"
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
                  <Label htmlFor="email">Admin Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. abc_admin@ScoreKind.in"
                    autoComplete="email"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must include the keyword &quot;admin&quot; in the address.
                  </p>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                      placeholder="Re-enter password"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting}
                  className="w-full font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Registering Administrator...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="mr-2 size-4" />
                      Register as Administrator
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Normal golfer?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Subscriber Sign Up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
