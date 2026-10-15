import { Search, SlidersHorizontal } from 'lucide-react'
import type { LeaveStatus } from '../types/leave.types'
import { leaveTypes } from '../types/leave.types'

export type LeaveFilter = 'All' | LeaveStatus

export default function LeaveFilters({
  query, filter, leaveType, counts, onQueryChange, onFilterChange, onLeaveTypeChange,
}: {
  query: string
  filter: LeaveFilter
  leaveType: string
  counts: Record<LeaveFilter, number>
  onQueryChange: (value: string) => void
  onFilterChange: (value: LeaveFilter) => void
  onLeaveTypeChange: (value: string) => void
}) {
  const filters: LeaveFilter[] = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']
  return (
    <div className="leave-filter-bar">
      <div className="leave-filter-tabs" aria-label="Filter leave requests by status">
        {filters.map((status) => <button key={status} className={filter === status ? 'is-active' : ''} aria-pressed={filter === status} onClick={() => onFilterChange(status)}>{status}<span>{counts[status]}</span></button>)}
      </div>
      <label className="leave-search"><Search size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search employee, leave type, or reason" aria-label="Search leave requests" /></label>
      <label className="leave-type-filter"><SlidersHorizontal size={15} /><select aria-label="Filter by leave type" value={leaveType} onChange={(event) => onLeaveTypeChange(event.target.value)}><option value="All">All leave types</option>{leaveTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
    </div>
  )
}
