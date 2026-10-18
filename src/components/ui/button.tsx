import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B362B]/20 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer button',
  {
    variants: {
      variant: {
        default:
          'bg-[#1B362B] text-white shadow-sm hover:bg-[#254A3B] button--primary',
        primary:
          'bg-[#1B362B] text-white shadow-sm hover:bg-[#254A3B] button--primary',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 button--destructive',
        outline:
          'border border-slate-200 bg-white text-[#1B362B] shadow-sm hover:bg-[#E6F4EA] button--outline',
        secondary:
          'bg-[#E6F4EA] text-[#1B362B] hover:bg-[#CFEBD7] button--secondary',
        ghost: 'text-[#1B362B] hover:bg-[#E6F4EA] button--ghost',
        link: 'text-[#1B362B] font-semibold underline-offset-4 hover:underline button--link',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-xl px-3 text-xs',
        lg: 'h-10 rounded-xl px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
