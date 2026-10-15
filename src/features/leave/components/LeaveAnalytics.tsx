import { ChartNoAxesColumnIncreasing } from 'lucide-react'
import type { LeaveStatus } from '../types/leave.types'

type StatusCount = { status: LeaveStatus; count: number }

const statusColors: Record<LeaveStatus, string> = {
  Approved: 'var(--leave-approved)',
  Pending: 'var(--leave-pending)',
  Rejected: 'var(--leave-rejected)',
  Cancelled: 'var(--color-muted)',
}

export default function LeaveAnalytics({ breakdown, total }: { breakdown: StatusCount[]; total: number }) {
  return (
    <section className="leave-widget leave-analytics-widget" aria-labelledby="leave-distribution-title">
      <div className="leave-widget-heading">
        <div className="leave-widget-icon"><ChartNoAxesColumnIncreasing size={17} /></div>
        <div><span className="leave-widget-kicker">REQUEST ANALYTICS</span><h2 id="leave-distribution-title">Request distribution</h2></div>
        <span className="leave-widget-total">{total} total</span>
      </div>
      <p className="leave-widget-description">A clear view of current leave request outcomes.</p>
      <div className="leave-stacked-track" role="img" aria-label={breakdown.map(({ status, count }) => `${status}: ${count}`).join(', ')}>
        {breakdown.map(({ status, count }) => <span key={status} className={`leave-stacked-segment leave-stacked-segment--${status.toLowerCase()}`} style={{ width: `${total ? count / total * 100 : 0}%` }} />)}
        {!total && <span className="leave-stacked-empty" />}
      </div>
      <ul className="leave-distribution-list">
        {breakdown.map(({ status, count }) => (
          <li key={status}>
            <span className="leave-distribution-label"><i style={{ background: statusColors[status] }} />{status}</span>
            <strong>{count}</strong><small>{total ? Math.round(count / total * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </section>
  )
}
