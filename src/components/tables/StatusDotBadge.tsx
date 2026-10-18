import * as React from 'react'
import { cn } from '@/lib/utils'

export type StatusVariant =
  | 'approved'
  | 'active'
  | 'present'
  | 'paid'
  | 'determined'
  | 'pending'
  | 'suspended'
  | 'late'
  | 'warning'
  | 'rejected'
  | 'inactive'
  | 'absent'
  | 'failed'
  | 'info'
  | 'leave'
  | 'default'

interface StatusDotBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string
  variant?: StatusVariant
}

export function StatusDotBadge({
  status,
  variant,
  className,
  ...props
}: StatusDotBadgeProps) {
  const norm = (status || '').toLowerCase()

  const has = (...needles: string[]) => needles.some((needle) => norm.includes(needle))
  // Negative states are checked first so "Inactive" / "Unpaid" / "Not approved"
  // never fall through to the positive "active" / "paid" / "approve" matches.
  // "late" is matched as a whole word so "Simulated" is not read as "Late".
  const resolvedVariant: StatusVariant =
    variant ??
    (has('reject', 'inact', 'absent', 'fail', 'revok', 'delet', 'cancel', 'not approved', 'declin')
      ? 'rejected'
      : has('suspend', 'pend', 'interim', 'warn', 'draft', 'unpaid', 'await', 'process', 'review') || /\blate\b/.test(norm)
        ? 'pending'
        : has('approve', 'active', 'present', 'paid', 'complet', 'disburs', 'determined', 'verified', 'success')
          ? 'approved'
          : 'info')

  const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
    approved: {
      badge: 'bg-[#E6F4EA] text-[#1E7E48] border-[#CFEBD7]',
      dot: 'bg-[#1E7E48]',
    },
    active: {
      badge: 'bg-[#E6F4EA] text-[#1E7E48] border-[#CFEBD7]',
      dot: 'bg-[#1E7E48]',
    },
    present: {
      badge: 'bg-[#E6F4EA] text-[#1E7E48] border-[#CFEBD7]',
      dot: 'bg-[#1E7E48]',
    },
    paid: {
      badge: 'bg-[#E6F4EA] text-[#1E7E48] border-[#CFEBD7]',
      dot: 'bg-[#1E7E48]',
    },
    determined: {
      badge: 'bg-[#E6F4EA] text-[#1E7E48] border-[#CFEBD7]',
      dot: 'bg-[#1E7E48]',
    },
    pending: {
      badge: 'bg-white text-[#1B362B] border-[#2A5243]/45 border-dashed',
      dot: 'bg-white ring-[1.5px] ring-[#2A5243]',
    },
    suspended: {
      badge: 'bg-white text-[#1B362B] border-[#2A5243]/45 border-dashed',
      dot: 'bg-white ring-[1.5px] ring-[#2A5243]',
    },
    late: {
      badge: 'bg-white text-[#1B362B] border-[#2A5243]/45 border-dashed',
      dot: 'bg-white ring-[1.5px] ring-[#2A5243]',
    },
    warning: {
      badge: 'bg-white text-[#1B362B] border-[#2A5243]/45 border-dashed',
      dot: 'bg-white ring-[1.5px] ring-[#2A5243]',
    },
    rejected: {
      badge: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
    },
    inactive: {
      badge: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
    },
    absent: {
      badge: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
    },
    failed: {
      badge: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      dot: 'bg-[#DC2626]',
    },
    info: {
      badge: 'bg-[#F0FDF4] text-[#1B362B] border-[#CFEBD7]',
      dot: 'bg-[#1B362B]',
    },
    leave: {
      badge: 'bg-[#F0FDF4] text-[#1B362B] border-[#CFEBD7]',
      dot: 'bg-[#1B362B]',
    },
    default: {
      badge: 'bg-[#F0FDF4] text-[#1B362B] border-[#CFEBD7]',
      dot: 'bg-[#1B362B]',
    },
  }

  const current = variantStyles[resolvedVariant] || variantStyles.default

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold tracking-[0.01em] border shadow-2xs whitespace-nowrap status-pill status-dot-badge',
        `status-dot-badge--${resolvedVariant}`,
        current.badge,
        className
      )}
      {...props}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      {status}
    </span>
  )
}

