import { classNames } from '@/utils/classNames'
import type { ReactNode } from 'react'

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled,
  onClick,
  className,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classNames('button', `button--${variant}`, className)}>
      {children}
    </button>
  )
}
