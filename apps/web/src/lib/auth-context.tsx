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
  signin: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  signout: () => void
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
  const signin = async (email: string, password: string) => {
    // TODO: Implement signin API call in Phase 3
    console.log('Signin:', { email, password })
    throw new Error('Not implemented')
  }

  /**
   * Sign up with email and password
   */
  const signup = async (email: string, password: string) => {
    // TODO: Implement signup API call in Phase 3
    console.log('Signup:', { email, password })
    throw new Error('Not implemented')
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
        signin,
        signup,
        signout,
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
