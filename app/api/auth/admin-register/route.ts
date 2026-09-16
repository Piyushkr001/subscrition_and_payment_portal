import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const adminRegisterSchema = z.object({
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
    .min(8, "Admin password must be at least 8 characters long"),
})

/**
 * GET /api/auth/admin-register
 * Queries current active admin quota (maximum 3 permitted)
 */
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")

    if (error) {
      return NextResponse.json(
        { error: "Failed to query admin count" },
        { status: 500 }
      )
    }

    const currentCount = count ?? 0
    const maxAdmins = 3

    return NextResponse.json({
      currentAdmins: currentCount,
      maxAdmins,
      availableSlots: Math.max(0, maxAdmins - currentCount),
      canRegister: currentCount < maxAdmins,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/auth/admin-register
 * Secure admin registration with strict quota limit (max 3) and keyword validation
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = adminRegisterSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      )
    }

    const { fullName, email, password } = validation.data
    const normalizedEmail = email.trim().toLowerCase()

    // 1. Strict keyword check
    if (!normalizedEmail.includes("admin")) {
      return NextResponse.json(
        {
          error:
            'Admin registration rejected: email must contain the keyword "admin" (e.g. abc_admin@ScoreKind.in)',
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 2. Strict quota check: Maximum 3 administrators allowed in the system
    const { count, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")

    if (countError) {
      return NextResponse.json(
        { error: "Database error checking administrator quota" },
        { status: 500 }
      )
    }

    const activeAdmins = count ?? 0
    if (activeAdmins >= 3) {
      return NextResponse.json(
        {
          error:
            "Admin registration limit reached: a maximum of 3 administrators are permitted in the system. No more admin accounts can be registered.",
        },
        { status: 403 }
      )
    }

    // 3. Create user in Supabase Auth via admin client
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
        },
      })

    if (createError || !userData.user) {
      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Failed to create user account. The email may already be registered.",
        },
        { status: 400 }
      )
    }

    // 4. Update the profile role to 'admin' using service-role privilege
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userData.user.id,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role: "admin",
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      return NextResponse.json(
        {
          error: `Account created, but setting admin role failed: ${profileError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message:
        "Administrator registered successfully. You may now sign in with your credentials.",
      user: {
        id: userData.user.id,
        email: normalizedEmail,
        role: "admin",
      },
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
