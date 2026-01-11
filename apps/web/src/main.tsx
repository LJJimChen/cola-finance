/**
 * Application entry point
 * 
 * Intent: Initialize React application with all providers and routing
 * 
 * Provider hierarchy:
 * 1. React.StrictMode - Development mode checks
 * 2. AuthProvider - Authentication state
 * 3. QueryClientProvider - Data fetching and caching
 * 4. RouterProvider - Routing
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/auth-context'
import { queryClient } from './lib/query-client'
import { routeTree } from './routeTree.gen'
import './lib/i18n' // Initialize i18n
import './index.css'

// Create router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
)
