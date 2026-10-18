import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: ReactNode
  /** Icon rendered in the light-emerald tile. */
  icon?: ReactNode
  /** Secondary line under the value, e.g. the period it covers. */
  hint?: ReactNode
  className?: string
}

/** Executive metric card: white surface, soft border, emerald icon tile, gentle hover lift. */
export function StatCard({ label, value, icon, hint, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'hrm-stat-card group flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-md',
        className,
      )}
    >
      <div className="grid min-w-0 gap-1">
        <span className="text-[11px] font-semibold uppercase leading-snug tracking-wider text-[#2A5243]">{label}</span>
        <strong className="text-[22px] font-bold leading-tight tracking-tight break-words text-[#1B362B] tabular-nums">{value}</strong>
        {hint ? <small className="text-xs leading-snug text-slate-500">{hint}</small> : null}
      </div>
      {icon ? (
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E6F4EA] text-[#1B362B] transition-colors duration-200 group-hover:bg-[#1B362B] group-hover:text-white">
          {icon}
        </span>
      ) : null}
    </div>
  )
}
