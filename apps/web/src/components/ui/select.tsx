import * as React from 'react'
import { cn } from '@/lib/utils'

type SelectContextValue = {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  items: Array<{ value: string; label: string }>
  setItems: (items: Array<{ value: string; label: string }>) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([])
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? '')
  const currentValue = value ?? uncontrolledValue

  const ctx: SelectContextValue = {
    value: currentValue,
    defaultValue,
    onValueChange: (next) => {
      if (value === undefined) setUncontrolledValue(next)
      onValueChange?.(next)
    },
    items,
    setItems,
  }

  return (
    <SelectContext.Provider value={ctx}>
      <div className={cn(disabled ? 'opacity-60 pointer-events-none' : '')}>{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext<SelectContextValue | null>(SelectContext)
  if (!ctx) return <div className={className} {...props} />

  return (
    <select
      value={ctx.value}
      onChange={(e) => ctx.onValueChange?.(e.target.value)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm',
        className
      )}
    >
      {ctx.items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  )
}

export function SelectValue({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) {
  void placeholder
  return <>{children}</>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext<SelectContextValue | null>(SelectContext)
  React.useEffect(() => {
    if (!ctx) return

    const next: Array<{ value: string; label: string }> = []
    const walk = (node: React.ReactNode) => {
      React.Children.forEach(node, (child) => {
        if (!React.isValidElement(child)) return
        if (child.type === SelectItem) {
          const value = String((child.props as any).value)
          const label = String((child.props as any).children ?? '')
          next.push({ value, label })
          return
        }
        if ((child.props as any)?.children) walk((child.props as any).children)
      })
    }

    walk(children)
    ctx.setItems(next)
  }, [children, ctx])

  return <>{children}</>
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  void value
  return <>{children}</>
}

