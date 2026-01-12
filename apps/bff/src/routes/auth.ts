/**
 * Authentication routes
 *
 * Intent: Handle user authentication (signup, signin, profile)
 * Provides endpoints for user registration and session management
 *
 * Contract:
 * - POST /auth/signup: Create new user account
 * - POST /auth/signin: Authenticate existing user
 * - GET /auth/me: Get current user profile
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { generateSessionToken } from '../lib/jwt'
import { createUser, authenticateUser } from '../lib/auth'
import type { Bindings } from '../index'

// Define route types
type AuthRoutes = {
  '/auth/signup': {
    $post: {
      body: {
        email: string
        password: string
        locale?: 'en' | 'zh'
        display_name?: string
      }
      response: {
        user: {
          id: string
          email: string
          locale: 'en' | 'zh'
          display_currency: string
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        token: string
      }
    }
  }
  '/auth/signin': {
    $post: {
      body: {
        email: string
        password: string
      }
      response: {
        user: {
          id: string
          email: string
          locale: 'en' | 'zh'
          display_currency: string
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        token: string
      }
    }
  }
  '/auth/me': {
    $get: {
      response: {
        user: {
          id: string
          email: string
          locale: 'en' | 'zh'
          display_currency: string
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
      }
    }
  }
}

// Create Hono app for auth routes
const app = new Hono<{ Bindings: Bindings }>()

// Signup endpoint
app.post(
  '/signup',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters'),
      locale: z.enum(['en', 'zh']).optional().default('en'),
      display_name: z.string().optional(),
    })
  ),
  async (c) => {
    const { email, password, locale, display_name } = c.req.valid('json')

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json(
        { error_code: 'USER_EXISTS', message: 'User with this email already exists' },
        409
      )
    }

    try {
      // Create user
      const user = await createUser(c.env.DB, email, password, locale)

      // Generate session token
      const token = await generateSessionToken(user.id, user.email, c.env.JWT_SECRET)

      // Return user and token
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          locale: user.locale,
          display_currency: user.display_currency,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at,
        },
        token,
      })
    } catch (error) {
      console.error('Signup error:', error)
      return c.json(
        { error_code: 'SIGNUP_FAILED', message: 'Failed to create user account' },
        500
      )
    }
  }
)

// Signin endpoint
app.post(
  '/signin',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    })
  ),
  async (c) => {
    const { email, password } = c.req.valid('json')

    try {
      // Authenticate user
      const user = await authenticateUser(c.env.DB, email, password)

      if (!user) {
        return c.json(
          { error_code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          401
        )
      }

      // Generate session token
      const token = await generateSessionToken(user.id, user.email, c.env.JWT_SECRET)

      // Return user and token
      return c.json({
        user: {
          id: user.id,
          email: user.email,
          locale: user.locale,
          display_currency: user.display_currency,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login_at: user.last_login_at,
        },
        token,
      })
    } catch (error) {
      console.error('Signin error:', error)
      return c.json(
        { error_code: 'SIGNIN_FAILED', message: 'Failed to authenticate user' },
        500
      )
    }
  }
)

// Get current user profile
app.get('/me', async (c) => {
  const userId = c.get('userId')
  const userEmail = c.get('userEmail')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401)
  }

  try {
    // Fetch user from database
    const user = await c.env.DB.prepare(
      'SELECT id, email, locale, display_currency, created_at, updated_at, last_login_at FROM users WHERE id = ?'
    ).bind(userId).first()

    if (!user) {
      return c.json({ error_code: 'USER_NOT_FOUND', message: 'User not found' }, 404)
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        locale: user.locale,
        display_currency: user.display_currency,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      },
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return c.json(
      { error_code: 'GET_PROFILE_FAILED', message: 'Failed to retrieve user profile' },
      500
    )
  }
})

export default app