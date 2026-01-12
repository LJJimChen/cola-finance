import * as React from 'react'
import { cn } from '@/lib/utils'

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn('relative w-full rounded-lg border border-gray-200 bg-white p-4 text-gray-950', className)}
      {...props}
    />
  )
)
Alert.displayName = 'Alert'

export const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('text-sm text-gray-700', className)} {...props} />
)
AlertDescription.displayName = 'AlertDescription'

