import * as React from 'react'

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

function getVariantClassName(variant: ButtonVariant) {
  switch (variant) {
    case 'outline':
      return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
    case 'ghost':
      return 'hover:bg-accent hover:text-accent-foreground'
    default:
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
  }
}

function getSizeClassName(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return 'h-9 px-3 text-sm'
    case 'lg':
      return 'h-11 px-6 text-base'
    case 'icon':
      return 'h-10 w-10 p-0'
    default:
      return 'h-10 px-4 py-2'
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={[
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          getVariantClassName(variant),
          getSizeClassName(size),
          className,
        ].join(' ')}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

