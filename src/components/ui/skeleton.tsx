import * as React from 'react'
import { cn } from '@/lib/utils'

/** Shadcn-style skeleton block: a pulsing light-emerald shape. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('hrm-skeleton animate-pulse rounded-md bg-[#E6F4EA]', className)} {...props} />
}

/** Announces the loading state to assistive tech while the wireframe is visible. */
function SkeletonStatus({ label }: { label: string }) {
  return <span className="sr-only" role="status" aria-live="polite">{label}</span>
}

const BAR_HEIGHTS = ['45%', '70%', '55%', '85%', '62%', '78%', '50%']

/** Chart card wireframe: eyebrow pill, title, subtitle and a bar-chart shape. */
function ChartCardSkeleton({ label = 'Loading chart', className, minHeight = 300 }: { label?: string; className?: string; minHeight?: number }) {
  return (
    <section className={cn('card hrm-skeleton-card', className)} style={{ minHeight }} aria-busy="true">
      <SkeletonStatus label={label} />
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="mt-3 h-5 w-48" />
      <Skeleton className="mt-2 h-3 w-64 max-w-full" />
      <div className="hrm-skeleton-chart">
        {BAR_HEIGHTS.map((height, index) => (
          <Skeleton key={index} className="flex-1 rounded-t-lg rounded-b-none" style={{ height }} />
        ))}
      </div>
    </section>
  )
}

/** Metric card wireframe: label, value and icon tile. */
function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card hrm-skeleton-card hrm-skeleton-stat', className)} aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 gap-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-14" />
        </div>
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-3 w-20" />
    </div>
  )
}

/**
 * Table wireframe matching the multi-line grid: uppercase header strip, then rows
 * with an avatar + name/email/pill cell, an accent column and a status pill.
 */
function TableSkeleton({ rows = 6, columns = 5, label = 'Loading records', className }: { rows?: number; columns?: number; label?: string; className?: string }) {
  const rest = Math.max(columns - 1, 1)
  const grid = { gridTemplateColumns: `minmax(200px, 2fr) repeat(${rest}, minmax(80px, 1fr))` }
  return (
    <div className={cn('hrm-skeleton-table', className)} aria-busy="true">
      <SkeletonStatus label={label} />
      <div className="hrm-skeleton-table__head" style={grid}>
        <Skeleton className="h-3 w-20" />
        {Array.from({ length: rest }, (_, index) => <Skeleton key={index} className="h-3 w-16" />)}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="hrm-skeleton-table__row" style={grid}>
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="grid min-w-0 flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-32 max-w-full" />
              <Skeleton className="h-3 w-40 max-w-full opacity-70" />
              <Skeleton className="h-4 w-20 rounded-full opacity-80" />
            </div>
          </div>
          {Array.from({ length: rest }, (_, column) =>
            column === rest - 1 ? (
              <Skeleton key={column} className="h-6 w-20 rounded-full" />
            ) : column === 1 ? (
              <div key={column} className="grid gap-1.5 border-l-2 border-[#E6F4EA] pl-2.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-14 opacity-70" />
              </div>
            ) : (
              <Skeleton key={column} className="h-3.5 w-24 max-w-full" />
            )
          )}
        </div>
      ))}
    </div>
  )
}

/** Stacked list wireframe (notifications, activity feeds). */
function ListSkeleton({ rows = 4, label = 'Loading', className }: { rows?: number; label?: string; className?: string }) {
  return (
    <div className={cn('grid gap-3 p-3', className)} aria-busy="true">
      <SkeletonStatus label={label} />
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2 opacity-70" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Full page wireframe: header, metric cards, toolbar and table. */
function PageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <div className="hrm-skeleton-page" aria-busy="true">
      <SkeletonStatus label={label} />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-3.5 w-80 max-w-full opacity-70" />
      </div>
      <div className="hrm-skeleton-stats">
        {Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index} />)}
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-72 max-w-full rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <TableSkeleton rows={6} columns={6} />
    </div>
  )
}

export { Skeleton, ChartCardSkeleton, StatCardSkeleton, TableSkeleton, ListSkeleton, PageSkeleton }
