/**
 * Authentication context
 * 
 * Intent: Manage user authentication state and JWT tokens
 * Provides auth state to entire application via React Context
 * 
 * Contract:
 * - Stores JWT token in localStorage
 * - Auto-refreshes token before expiration
 * - Provides signin/signup/signout functions
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// Temporarily use direct type definition until schema package is built
type UserPublic = {
  id: string
  email: string
  email_verified: boolean
  display_name: string | null
  locale: 'en' | 'zh'
  display_currency: string
  created_at: string
  updated_at: string
  last_login_at: string | null
}

interface AuthContextValue {
  user: UserPublic | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string, locale?: 'en' | 'zh') => Promise<void>
  signout: () => void
  updateUserPreferences: (updates: Partial<Pick<UserPublic, 'display_currency' | 'locale' | 'display_name'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Authentication provider component
 * 
 * Intent: Wrap app with auth state management
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')

    if (savedToken) {
      setToken(savedToken)
      // TODO: Fetch user profile with token
    }

    setIsLoading(false)
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = async (_email: string, _password: string) => {
    throw new Error('Not implemented')
  }

  /**
   * Sign up with email and password
   */
  const signUp = async (_email: string, _password: string, _displayName?: string, _locale?: 'en' | 'zh') => {
    throw new Error('Not implemented')
  }

  const updateUserPreferences = async (
    updates: Partial<Pick<UserPublic, 'display_currency' | 'locale' | 'display_name'>>
  ) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, ...updates }
    })
  }

  /**
   * Sign out and clear auth state
   */
  const signout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        signUp,
        signout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 * 
 * Intent: Provide convenient access to auth state
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
