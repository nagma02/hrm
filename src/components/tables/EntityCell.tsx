import * as React from 'react'
import { cn } from '@/lib/utils'

interface EntityCellProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  tags?: Array<{ label: string; variant?: 'gray' | 'green' | 'blue' | 'amber' }>
  className?: string
  avatar?: React.ReactNode
  onClick?: () => void
}

export function EntityCell({
  title,
  subtitle,
  tags,
  className,
  avatar,
  onClick,
}: EntityCellProps) {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      {avatar}
      <div className="min-w-0">
        <div className="font-medium text-slate-900 text-[13.5px] leading-snug truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] font-normal text-slate-400 mt-0.5 truncate">
            {subtitle}
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide',
                  tag.variant === 'green'
                    ? 'bg-[#E6F4EA] text-[#1E7E48]'
                    : 'bg-[#E6F4EA] text-[#1B362B]'
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left cursor-pointer hover:opacity-80 transition-opacity w-full block"
      >
        {content}
      </button>
    )
  }

  return content
}

