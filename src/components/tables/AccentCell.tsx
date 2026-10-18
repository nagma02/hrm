import * as React from 'react'
import { cn } from '@/lib/utils'

interface AccentCellProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  color?: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose'
  className?: string
}

export function AccentCell({
  title,
  subtitle,
  color = 'emerald',
  className,
}: AccentCellProps) {
  const colorStyles = {
    emerald: 'border-[#1B362B] text-[#1B362B]',
    blue: 'border-[#1B362B] text-[#1B362B]',
    amber: 'border-[#1B362B] text-[#1B362B]',
    rose: 'border-[#1B362B] text-[#1B362B]',
    slate: 'border-[#1B362B] text-[#1B362B]',
  }

  return (
    <div className={cn('border-l-2 pl-2.5 py-0.5', colorStyles[color], className)}>
      <div className="text-xs font-semibold leading-tight">{title}</div>
      {subtitle && (
        <div className="text-[11px] font-normal text-slate-400 mt-0.5">
          {subtitle}
        </div>
      )}
    </div>
  )
}

