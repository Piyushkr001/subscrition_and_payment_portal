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
import { loginSchema, type LoginInput } from "@/lib/validators/auth"
import { createClient } from "@/lib/supabase/client"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const signupSuccess = searchParams.get("signup") === "success"
  const authErrorParam = searchParams.get("error")

  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    authErrorParam
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

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
            ? "Invalid email or password. Please verify and try again."
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

      if (profile?.role === "admin") {
        router.push("/admin")
      } else {
        router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard")
      }
      router.refresh()
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.")
    }
  }

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

      <Card className="border-border/60 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in to your ScoreKind account to manage scores and draws
          </CardDescription>
        </CardHeader>

        <CardContent>
          {signupSuccess && (
            <Alert className="mb-4 border-teal-500/20 bg-teal-500/10 text-teal-800 dark:text-teal-300">
              <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
              <AlertTitle>Account created</AlertTitle>
              <AlertDescription className="text-xs">
                Your account is ready. Sign in with your credentials.
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              className="w-full font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 size-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Join ScoreKind
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Platform administrator?{" "}
            <Link
              href="/admin-register"
              className="font-medium text-destructive underline-offset-4 hover:underline"
            >
              Admin Registration (Max 3)
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
