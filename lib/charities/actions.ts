"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/require-user"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  charityPreferenceSchema,
  charityAdminSchema,
  type CharityPreferenceInput,
  type CharityAdminInput,
} from "@/lib/validators/charity"
import type { CharityStatus } from "@/types/database"

export interface ActionResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

/**
 * Subscriber Action: Update or establish charitable contribution preference.
 * Guaranteed:
 * - Authenticated user identity from Supabase session (client userId is never accepted).
 * - Enforced percentage bounds: 10% to 100%.
 * - Rejects inactive or nonexistent charities.
 */
export async function updateUserCharityPreferenceAction(
  rawInput: CharityPreferenceInput
): Promise<ActionResponse> {
  try {
    const { user } = await requireUser("/login")

    const parseResult = charityPreferenceSchema.safeParse(rawInput)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid preference data.",
      }
    }

    const { charityId, contributionPercentage } = parseResult.data
    const supabase = await createClient()

    // 1. Verify that the requested charity exists and is ACTIVE
    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id, name, status")
      .eq("id", charityId)
      .maybeSingle()

    if (charityError || !charity) {
      return {
        success: false,
        error: "Selected charity partner was not found.",
      }
    }

    if (charity.status !== "active") {
      return {
        success: false,
        error: "This charity partner is currently not accepting new contributions.",
      }
    }

    // 2. Upsert subscriber preference
    const { error: upsertError } = await supabase
      .from("charity_preferences")
      .upsert(
        {
          user_id: user.id,
          charity_id: charityId,
          contribution_percentage: contributionPercentage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      console.error("[Charity Preference Action Error]:", upsertError)
      return {
        success: false,
        error: "Failed to save your charity preference. Please try again.",
      }
    }

    revalidatePath("/dashboard/charity")
    revalidatePath("/dashboard")
    revalidatePath("/charities")

    return {
      success: true,
      message: `Your charity preference has been updated to ${charity.name} (${contributionPercentage}% allocation).`,
    }
  } catch (err) {
    console.error("[Charity Preference Action Exception]:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred.",
    }
  }
}

/**
 * Admin Action: Create or update a charity partner.
 * Guaranteed:
 * - Admin authorization checked strictly on server.
 * - Zod validated schema.
 * - Unique slug verification.
 */
export async function adminSaveCharityAction(
  rawInput: CharityAdminInput & { id?: string }
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin()

    const parseResult = charityAdminSchema.safeParse(rawInput)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid charity data.",
      }
    }

    const { name, slug, description, websiteUrl, logoUrl, coverUrl, status, featured } =
      parseResult.data
    const supabaseAdmin = createAdminClient()

    // Slug conflict check (excluding current charity if updating)
    let slugQuery = supabaseAdmin.from("charities").select("id").eq("slug", slug)
    if (rawInput.id) {
      slugQuery = slugQuery.neq("id", rawInput.id)
    }
    const { data: existingSlug } = await slugQuery.maybeSingle()

    if (existingSlug) {
      return {
        success: false,
        error: `The slug '${slug}' is already taken by another charity. Please choose a unique slug.`,
      }
    }

    let charityId = rawInput.id

    if (charityId) {
      // Update existing charity
      const { error: updateError } = await supabaseAdmin
        .from("charities")
        .update({
          name,
          slug,
          description: description || null,
          website_url: websiteUrl || null,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
          status: status as CharityStatus,
          featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", charityId)

      if (updateError) {
        console.error("[Admin Save Charity Update Error]:", updateError)
        return { success: false, error: updateError.message }
      }
    } else {
      // Create new charity
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("charities")
        .insert({
          name,
          slug,
          description: description || null,
          website_url: websiteUrl || null,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
          status: status as CharityStatus,
          featured,
        })
        .select("id")
        .single()

      if (insertError || !inserted) {
        console.error("[Admin Save Charity Insert Error]:", insertError)
        return { success: false, error: insertError?.message || "Failed to create charity." }
      }

      charityId = inserted.id
    }

    revalidatePath("/admin/charities")
    revalidatePath("/charities")
    revalidatePath(`/charities/${slug}`)
    revalidatePath("/dashboard/charity")

    return {
      success: true,
      message: `Charity '${name}' saved successfully.`,
      data: { id: charityId },
    }
  } catch (err) {
    console.error("[Admin Save Charity Exception]:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save charity.",
    }
  }
}

/**
 * Admin Action: Quick status toggle (draft, active, inactive).
 */
export async function adminToggleCharityStatusAction(
  charityId: string,
  newStatus: CharityStatus
): Promise<ActionResponse> {
  try {
    await requireAdmin()
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from("charities")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", charityId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/charities")
    revalidatePath("/charities")
    revalidatePath("/dashboard/charity")

    return { success: true, message: `Charity status set to ${newStatus}.` }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    }
  }
}

/**
 * Admin Action: Quick featured toggle.
 */
export async function adminToggleCharityFeaturedAction(
  charityId: string,
  featured: boolean
): Promise<ActionResponse> {
  try {
    await requireAdmin()
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from("charities")
      .update({
        featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", charityId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/charities")
    revalidatePath("/charities")

    return {
      success: true,
      message: featured ? "Charity highlighted as featured." : "Charity unfeatured.",
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update featured flag.",
    }
  }
}

/**
 * Admin Action: Safe delete or archive charity.
 * Hard-delete is rejected if historical preferences or contributions exist.
 */
export async function adminDeleteCharityAction(charityId: string): Promise<ActionResponse> {
  try {
    await requireAdmin()
    const supabaseAdmin = createAdminClient()

    // 1. Check for historical preferences
    const { count: prefCount } = await supabaseAdmin
      .from("charity_preferences")
      .select("id", { count: "exact", head: true })
      .eq("charity_id", charityId)

    // 2. Check for historical contributions
    const { count: contribCount } = await supabaseAdmin
      .from("charity_contributions")
      .select("id", { count: "exact", head: true })
      .eq("charity_id", charityId)

    if ((prefCount && prefCount > 0) || (contribCount && contribCount > 0)) {
      return {
        success: false,
        error:
          "Cannot permanently delete this charity because members have historical preferences or contribution records linked to it. Please deactivate the charity instead to preserve financial audit history.",
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("charities")
      .delete()
      .eq("id", charityId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/admin/charities")
    revalidatePath("/charities")
    revalidatePath("/dashboard/charity")

    return { success: true, message: "Charity removed successfully." }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete charity.",
    }
  }
}

/**
 * Admin Action: Upload charity logo or cover image into Supabase Storage.
 * Guaranteed:
 * - Admin authorization.
 * - Allowed types: image/jpeg, image/png, image/webp, image/svg+xml.
 * - Max size: 5MB.
 * - Public URL generated from charity-media bucket.
 */
export async function adminUploadCharityMediaAction(
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  try {
    await requireAdmin()

    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) || "logo"

    if (!file) {
      return { success: false, error: "No media file provided." }
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Image file exceeds maximum allowed size of 5MB." }
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if (!allowedMimeTypes.includes(file.type)) {
      return {
        success: false,
        error: "Unsupported file type. Please upload a JPEG, PNG, WebP, or SVG image.",
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeExt = ["jpg", "jpeg", "png", "webp", "svg"].includes(ext) ? ext : "jpg"
    const randomId = crypto.randomUUID()
    const filePath = `${type}s/${randomId}.${safeExt}`

    const supabaseAdmin = createAdminClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from("charity-media")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError)
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("charity-media")
      .getPublicUrl(filePath)

    return {
      success: true,
      data: { url: publicUrlData.publicUrl },
      message: "Media uploaded successfully.",
    }
  } catch (err) {
    console.error("[Upload Charity Media Exception]:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Media upload failed.",
    }
  }
}
