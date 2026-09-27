import { z } from "zod"

/**
 * Charity Preference Validation Schema
 *
 * Rules:
 * 1. charityId must be a valid UUID corresponding to an active charity.
 * 2. contributionPercentage must be an integer between 10 and 100 inclusive.
 */
export const charityPreferenceSchema = z.object({
  charityId: z.string().uuid("Please select a valid partner charity"),
  contributionPercentage: z
    .number({
      error: "Contribution percentage is required",
    })
    .int("Percentage must be a whole number")
    .min(10, "Minimum contribution is 10% of subscription")
    .max(100, "Maximum contribution is 100% of subscription"),
})

export type CharityPreferenceInput = z.infer<typeof charityPreferenceSchema>

/**
 * Admin Charity Management Schema
 */
export const charityAdminSchema = z.object({
  name: z
    .string()
    .min(2, "Charity name must be at least 2 characters")
    .max(100, "Charity name cannot exceed 100 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase alphanumeric with hyphens (e.g. first-tee-foundation)",
    })
    .trim(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional().nullable(),
  websiteUrl: z
    .string()
    .url("Please enter a valid website URL (https://...)")
    .or(z.literal(""))
    .optional()
    .nullable(),
  logoUrl: z.string().url("Invalid logo URL").or(z.literal("")).optional().nullable(),
  coverUrl: z.string().url("Invalid cover image URL").or(z.literal("")).optional().nullable(),
  status: z.enum(["draft", "active", "inactive"], {
    error: "Status must be draft, active, or inactive",
  }),
  featured: z.boolean(),
})

export type CharityAdminInput = z.infer<typeof charityAdminSchema>
