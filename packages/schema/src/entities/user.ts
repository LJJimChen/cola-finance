/**
 * User entity type definitions
 * 
 * Intent: Define User entity structure and validation rules
 * Used across frontend, BFF, and Engine for type safety
 * 
 * Contract:
 * - User represents a person using the system
 * - Owns broker connections, preferences, and portfolios
 * - Email must be unique and validated
 * - Password hash never exposed in API responses
 */
import { z } from 'zod'

/**
 * Supported locales for the application
 */
export const LocaleSchema = z.enum(['en', 'zh'])
export type Locale = z.infer<typeof LocaleSchema>

/**
 * User entity schema
 * 
 * Validation rules:
 * - email: Must be valid email format
 * - locale: Must be 'en' or 'zh'
 * - display_currency: ISO 4217 currency code
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  email_verified: z.boolean(),
  password_hash: z.string().optional(), // Never exposed in API responses
  display_name: z.string().nullable(),
  locale: LocaleSchema,
  display_currency: z.string().length(3), // ISO 4217 code (e.g., 'USD', 'CNY')
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  last_login_at: z.string().datetime().nullable(),
})

export type User = z.infer<typeof UserSchema>

/**
 * User creation input (for signup)
 */
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  display_name: z.string().optional(),
  locale: LocaleSchema.optional(),
  display_currency: z.string().length(3).optional(),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>

/**
 * User public profile (safe for API responses)
 * Excludes password_hash
 */
export const UserPublicSchema = UserSchema.omit({ password_hash: true })
export type UserPublic = z.infer<typeof UserPublicSchema>

/**
 * User preferences update input
 */
export const UpdateUserPreferencesSchema = z.object({
  display_name: z.string().optional(),
  locale: LocaleSchema.optional(),
  display_currency: z.string().length(3).optional(),
})

export type UpdateUserPreferencesInput = z.infer<typeof UpdateUserPreferencesSchema>
