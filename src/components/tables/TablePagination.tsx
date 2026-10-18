import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TablePaginationProps {
  page: number
  pageCount: number
  totalItems: number
  pageSize?: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  const safePageCount = Math.max(1, pageCount)

  // Generate page numbers with ellipsis
  const getPages = () => {
    const pages: (number | string)[] = []
    if (safePageCount <= 7) {
      for (let i = 1; i <= safePageCount; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(safePageCount - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < safePageCount - 2) pages.push('...')
      pages.push(safePageCount)
    }
    return pages
  }

  const size = pageSize || 10
  const from = totalItems === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(totalItems, page * size)
  const entryText =
    totalItems <= size
      ? `Showing ${totalItems} of ${totalItems} entries`
      : `Showing ${from} to ${to} of ${totalItems} entries`

  return (
    <div className={cn('py-4 flex flex-col items-center justify-center gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer',
                  p === page
                    ? 'bg-[#1B362B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-xs text-slate-400">
                ...
              </span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safePageCount, page + 1))}
          disabled={page >= safePageCount}
          aria-label="Next page"
          className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="text-xs text-slate-400 text-center font-normal">
        {entryText}
      </div>
    </div>
  )
}
