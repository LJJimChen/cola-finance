/**
 * Root route component
 * 
 * Intent: Top-level router layout with outlet for child routes
 * Wraps all pages with providers and layout components
 */
import { Outlet } from '@tanstack/react-router'

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  )
}
