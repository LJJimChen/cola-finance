/**
 * Better Auth configuration
 * 
 * Intent: Configure authentication for BFF using Better Auth
 * Provides email/password authentication with JWT tokens
 * 
 * Contract:
 * - Email/password signup and signin
 * - JWT tokens for session management
 * - User data stored in D1 database
 */
import type { D1Database } from '@cloudflare/workers-types'
import { drizzle } from 'drizzle-orm/d1'
import { users } from '../db/schema/users'
import { eq } from 'drizzle-orm'

/**
 * Hash password using Web Crypto API (Cloudflare Workers compatible)
 * 
 * Intent: Securely hash passwords for storage
 * Uses PBKDF2 with 100,000 iterations
 * 
 * Input: Plain text password
 * Output: Base64-encoded hash with salt
 * Side effects: None
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  )

  const hashArray = new Uint8Array(derivedBits)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Verify password against stored hash
 * 
 * Intent: Check if provided password matches stored hash
 * 
 * Input: Plain text password, stored hash
 * Output: Boolean indicating match
 * Side effects: None
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const storedHashArray = combined.slice(16)

  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits'])

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  )

  const hashArray = new Uint8Array(derivedBits)

  if (hashArray.length !== storedHashArray.length) {
    return false
  }

  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== storedHashArray[i]) {
      return false
    }
  }

  return true
}

/**
 * Create user in database
 * 
 * Intent: Register new user with email and password
 * 
 * Input: Database connection, email, password, optional locale
 * Output: Created user object (without password_hash)
 * Side effects: Inserts record into users table
 */
export async function createUser(
  db: D1Database,
  email: string,
  password: string,
  locale: 'en' | 'zh' = 'en'
) {
  const orm = drizzle(db)
  const passwordHash = await hashPassword(password)

  const [user] = await orm
    .insert(users)
    .values({
      email,
      password_hash: passwordHash,
      locale,
      email_verified: false,
    })
    .returning()

  // Remove password_hash from response
  const safeUser = user as typeof users.$inferSelect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _removed, ...userWithoutPassword } = safeUser
  return userWithoutPassword
}

/**
 * Authenticate user with email and password
 * 
 * Intent: Verify credentials and return user if valid
 * 
 * Input: Database connection, email, password
 * Output: User object (without password_hash) or null if invalid
 * Side effects: Updates last_login_at timestamp
 */
export async function authenticateUser(db: D1Database, email: string, password: string) {
  const orm = drizzle(db)

  const [user] = await orm.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user) {
    return null
  }

  if (!user.password_hash) {
    return null
  }

  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  // Update last login
  await orm
    .update(users)
    .set({ last_login_at: new Date().toISOString() })
    .where(eq(users.id, user.id))

  // Remove password_hash from response
  const safeUser = user as typeof users.$inferSelect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _removed, ...userWithoutPassword } = safeUser
  return userWithoutPassword
}
