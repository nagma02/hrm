import { leaveService } from '@/features/leave/services/leave.service'
import { navigateTo } from '@/app/router/navigation'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

const leaveStatuses = [
  { key: 'approved', label: 'Approved', color: 'approved' },
  { key: 'pending', label: 'Pending', color: 'pending' },
  { key: 'rejected', label: 'Rejected', color: 'rejected' },
] as const

export default function LeaveOverview() {
  useHRMDataChange()
  const requests = leaveService.list()
  const leaveOverview = { approved: requests.filter((row) => row.status === 'Approved').length, pending: requests.filter((row) => row.status === 'Pending').length, rejected: requests.filter((row) => row.status === 'Rejected').length }
  const total = leaveOverview.approved + leaveOverview.pending + leaveOverview.rejected

  return (
    <section className="card leave-overview-card">
      <div className="leave-overview-header">
        <div><div className="badge badge--info">Leave</div><h3 className="section-title">Leave Overview</h3></div>
        <span className="leave-overview-total">{total} total</span>
      </div>

      <div className="leave-overview-body">
        <div className="leave-status-list">
          {leaveStatuses.map(({ key, label, color }) => {
            const count = leaveOverview[key]
            const percentage = total ? (count / total) * 100 : 0
            return (
              <button className={`leave-status-row leave-status-row--${color} leave-status-row--clickable`} key={key} onClick={() => navigateTo('/app/leave')}>
                <div className="leave-status-meta"><span>{label}</span><strong>{count}<small>{percentage.toFixed(0)}%</small></strong></div>
                <div className="leave-status-track" role="progressbar" aria-label={`${label} leave requests`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={count}><span style={{ width: `${percentage}%` }} /></div>
              </button>
            )
          })}
        </div>
        <div className="leave-approved-summary"><span>Approved</span><strong>{leaveOverview.approved}</strong><small>requests</small></div>
      </div>
    </section>
  )
}
