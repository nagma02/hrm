import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TableFilterTab {
  id: string
  label: string
  count?: number
}

interface TableFilterTabsProps {
  tabs: TableFilterTab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function TableFilterTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TableFilterTabsProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-3.5 flex-wrap', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'table-filter-tab rounded-xl border px-3.5 py-1 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer',
              isActive
                ? 'is-active border-[#1B362B] bg-[#1B362B] text-white shadow-xs'
                : 'border-[#E6F4EA] bg-[#E6F4EA] text-[#1B362B] hover:bg-[#CFEBD7]'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'table-filter-tab__count px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#1B362B]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

