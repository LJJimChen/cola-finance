import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function getVariantClassName(variant: BadgeVariant) {
  switch (variant) {
    case 'secondary':
      return 'bg-gray-100 text-gray-900'
    case 'destructive':
      return 'bg-red-100 text-red-700'
    case 'outline':
      return 'border border-gray-200 text-gray-900'
    default:
      return 'bg-blue-600 text-white'
  }
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getVariantClassName(variant),
        className
      )}
      {...props}
    />
  )
}

