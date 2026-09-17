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
  Loader2,
  LogIn,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  User,
  ShieldAlert,
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
import { loginSchema, type LoginInput } from "@/lib/validators/auth"
import { createClient } from "@/lib/supabase/client"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

type AccountType = "member" | "admin"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const signupSuccess = searchParams.get("signup") === "success"
  const adminRegistered = searchParams.get("admin") === "registered"
  const authErrorParam = searchParams.get("error")

  const [accountType, setAccountType] = React.useState<AccountType>("member")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    authErrorParam
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Synchronize when switching between member and admin
  const handleAccountTypeChange = (newType: AccountType) => {
    setAccountType(newType)
    setErrorMessage(null)
    if (newType === "admin") {
      setValue("email", "")
    }
  }

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null)
    try {
      const supabase = createClient()
      const { data: authData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        })

      if (error) {
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? "Invalid email or password. Please verify your credentials and try again."
            : error.message
        )
        return
      }

      if (!authData.user) {
        setErrorMessage("Authentication failed. Please try again.")
        return
      }

      // Check trusted profile role from the database
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single()

      // Enforce role separation if Admin login mode was chosen
      if (accountType === "admin") {
        if (profile?.role !== "admin") {
          // Immediately revoke session for unauthorized role
          await supabase.auth.signOut()
          setErrorMessage(
            "Access Denied: This account is registered as a Member and does not have administrator privileges. Please switch to Member login."
          )
          return
        }
        router.push("/admin")
      } else {
        if (profile?.role === "admin") {
          router.push("/admin")
        } else {
          router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard")
        }
      }
      router.refresh()
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.")
    }
  }

  const isAdmin = accountType === "admin"

  return (
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
          Score. Win. Give Back.
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
                Administrator Security Mode
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                <User className="size-3.5 text-primary" />
                ScoreKind Member Portal
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl font-bold tracking-tight">
            {isAdmin ? "Admin Portal Sign In" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-sm">
            {isAdmin
              ? "Restricted administrative console for platform management & auditing"
              : "Sign in to your ScoreKind account to manage scores, draws, and causes"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Account Type Selector (Dropdown & Checkbox Showcase) */}
          <div className="mb-5 rounded-xl border border-border/70 bg-muted/30 p-3.5">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="accountTypeSelect" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Login Role Selection:
                </Label>
                <NativeSelect
                  id="accountTypeSelect"
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
                  id="adminCheckbox"
                  checked={isAdmin}
                  onCheckedChange={(checked) =>
                    handleAccountTypeChange(checked ? "admin" : "member")
                  }
                />
                <label
                  htmlFor="adminCheckbox"
                  className="text-xs font-medium cursor-pointer text-muted-foreground select-none"
                >
                  Sign in as Platform Administrator
                </label>
              </div>
            </div>
          </div>

          {signupSuccess && (
            <Alert className="mb-4 border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-300">
              <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
              <AlertTitle>Account created</AlertTitle>
              <AlertDescription className="text-xs">
                Your member account is ready. Sign in with your credentials.
              </AlertDescription>
            </Alert>
          )}

          {adminRegistered && (
            <Alert className="mb-4 border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
              <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Administrator Registered</AlertTitle>
              <AlertDescription className="text-xs">
                Your administrator account has been created. Please sign in below.
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="size-4" />
              <AlertTitle>Sign In Error</AlertTitle>
              <AlertDescription className="text-xs">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Member Mode: Google Login */}
          {!isAdmin ? (
            <div className="mb-5 space-y-4">
              <GoogleSignInButton
                label="Sign in with Google (Members)"
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
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Executive Credential Requirement</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Google OAuth is restricted to Member accounts. Admins must authenticate via designated credentials.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
                  Authenticating...
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <ShieldCheck className="mr-2 size-4" />
                  ) : (
                    <LogIn className="mr-2 size-4" />
                  )}
                  {isAdmin ? "Sign In to Admin Portal" : "Sign In"}
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link
              href={isAdmin ? "/signup?role=admin" : "/signup"}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {isAdmin ? "Register as Admin" : "Join ScoreKind"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 sm:p-8">
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </React.Suspense>
    </main>
  )
}
