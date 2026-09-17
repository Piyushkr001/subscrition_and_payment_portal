import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const adminSignupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  adminCode: z.string().min(1, "Admin authorization code is required"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = adminSignupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    const { fullName, email, password, adminCode } = parsed.data

    // Verify executive authorization code
    const validCode = process.env.ADMIN_INVITE_CODE || "ScoreKindAdmin2026"
    if (adminCode.trim() !== validCode) {
      return NextResponse.json(
        {
          error:
            "Invalid Admin Authorization Code. Administrator onboarding requires executive clearance.",
        },
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Create user in auth.users with pre-confirmed email
    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
        },
      })

    if (createError || !authData.user) {
      return NextResponse.json(
        { error: createError?.message || "Failed to create administrator account" },
        { status: 400 }
      )
    }

    // 2. Set profile role to 'admin'
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (profileError) {
      return NextResponse.json(
        { error: `Account created, but failed to assign admin role: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Administrator account created successfully",
      userId: authData.user.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
