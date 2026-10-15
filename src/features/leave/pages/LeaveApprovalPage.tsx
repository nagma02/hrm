import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/use-auth'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import LeaveFilters, { type LeaveFilter } from '../components/LeaveFilters'
import LeaveRequestTable from '../components/LeaveRequestTable'
import { leaveService } from '../services/leave.service'
import { useLeaveApplications } from '../hooks/useLeaveApplications'
import type { LeaveApplication } from '../types/leave.types'

export function LeaveApprovalPage() {
  useHRMDataChange()
  const { user } = useAuth()
  const rows = useLeaveApplications()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<LeaveFilter>('All')
  const [leaveType, setLeaveType] = useState('All')

  const counts = {
    All: rows.length,
    Pending: rows.filter((row) => row.status === 'Pending').length,
    Approved: rows.filter((row) => row.status === 'Approved').length,
    Rejected: rows.filter((row) => row.status === 'Rejected').length,
    Cancelled: rows.filter((row) => row.status === 'Cancelled').length,
  }

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = filter === 'All' || row.status === filter
      const matchesType = leaveType === 'All' || row.leaveType === leaveType
      const matchesQuery = !normalizedQuery || [row.employeeName, row.leaveType, row.reason, row.id].some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesStatus && matchesType && matchesQuery
    })
  }, [filter, leaveType, query, rows])

  const onStatusChange = async (row: LeaveApplication, status: 'Approved' | 'Rejected') => {
    try {
      if (status === 'Approved') {
        await leaveService.updateStatus(row.id, 'Approved', { decisionBy: user?.name ?? 'HR Admin' })
        toast.success('Leave request approved.')
      } else {
        await leaveService.updateStatus(row.id, 'Rejected', { decisionBy: user?.name ?? 'HR Admin', decisionComment: 'Rejected from approvals queue.' })
        toast.success('Leave request rejected.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update this leave request.')
    }
  }

  return (
    <PageContainer>
      <main className="leave-page">
        <section className="panel leave-panel">
          <div className="leave-requests-heading">
            <div>
              <span className="leave-widget-kicker">APPROVAL QUEUE</span>
              <h2>Leave approvals</h2>
              <p>Review leave requests, confirm decisions, and keep staffing plans on schedule.</p>
            </div>
          </div>
          <LeaveFilters
            query={query}
            filter={filter}
            leaveType={leaveType}
            counts={{ All: counts.All, Pending: counts.Pending, Approved: counts.Approved, Rejected: counts.Rejected, Cancelled: counts.Cancelled }}
            onQueryChange={setQuery}
            onFilterChange={setFilter}
            onLeaveTypeChange={setLeaveType}
          />
          <LeaveRequestTable rows={visibleRows} onStatusChange={onStatusChange} />
        </section>
      </main>
    </PageContainer>
  )
}
