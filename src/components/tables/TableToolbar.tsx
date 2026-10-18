import * as React from 'react'
import { Search, ArrowUpDown, Filter, Layers, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TableToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string

  // Sort
  sortValue?: string
  onSortChange?: (value: string) => void
  sortOptions?: Array<{ label: string; value: string }>

  // Category Filter
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterOptions?: Array<{ label: string; value: string }>
  filterLabel?: string

  // Page Size
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]

  // Export
  onExport?: () => void
  exportLabel?: string

  children?: React.ReactNode
  className?: string
}

export function TableToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortValue,
  onSortChange,
  sortOptions,
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = 'All Categories',
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
  onExport,
  children,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-3.5',
        className
      )}
    >
      {/* Left Search input */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <label className="block w-full">
          <span className="sr-only">{searchPlaceholder.replace(/\.+$/, '')}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder.replace(/\.+$/, '')}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-shadow"
          />
        </label>
      </div>


      {/* Right controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort Select */}
        {sortOptions && onSortChange && (
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors pointer-events-none">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {sortOptions.find((o) => o.value === sortValue)?.label ?? 'Newest first'}
              </span>
              <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
            </div>
            <select
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort order"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category / Custom Filter */}
        {filterOptions && onFilterChange && (
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors pointer-events-none">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {filterOptions.find((o) => o.value === filterValue)?.label ?? filterLabel}
              </span>
              <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
            </div>
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              aria-label={filterLabel}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Size Select */}
        {pageSize && onPageSizeChange && (
          <div className="relative inline-flex items-center">
            <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors pointer-events-none">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{pageSize} per page</span>
              <span className="text-[10px] text-slate-400 ml-0.5">▼</span>
            </div>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom additional controls if any */}
        {children}

        {/* Export Button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            aria-label="Export table"
            title="Export table"
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
