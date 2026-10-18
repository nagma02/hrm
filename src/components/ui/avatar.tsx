import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

const AvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full avatar',
      className
    )}
    {...props}
  />
))
AvatarRoot.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-[#E6F4EA] font-semibold text-[#1B362B]',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  initials?: string
  name?: string
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ initials, name, children, className, ...props }, ref) => {
  if (initials || name) {
    const text = initials || name?.slice(0, 2).toUpperCase() || ''
    return (
      <AvatarRoot ref={ref} className={className} {...props}>
        <AvatarFallback>{text}</AvatarFallback>
      </AvatarRoot>
    )
  }
  return (
    <AvatarRoot ref={ref} className={className} {...props}>
      {children}
    </AvatarRoot>
  )
})
Avatar.displayName = 'Avatar'

export { Avatar, AvatarImage, AvatarFallback }