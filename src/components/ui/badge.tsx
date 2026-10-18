import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-[0.01em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 badge',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#1B362B] text-white hover:bg-[#254A3B] badge--primary',
        secondary:
          'border-transparent bg-[#E6F4EA] text-[#1B362B] badge--secondary',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 badge--destructive',
        outline: 'text-foreground badge--outline',
        success:
          'border-transparent bg-[#E6F4EA] text-[#1E7E48] badge--success',
        warning:
          'border-transparent bg-[#E6F4EA] text-[#1B362B] badge--warning',
        info:
          'border-transparent bg-[#E6F4EA] text-[#1B362B] badge--info',
        neutral:
          'border-transparent bg-slate-50 text-slate-500 badge--neutral',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: 'neutral' | 'success' | 'warning' | 'destructive' | 'info'
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? tone ?? 'default'
  return (
    <div
      className={cn(badgeVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }