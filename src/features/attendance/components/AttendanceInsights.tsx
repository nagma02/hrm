import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { navigateTo } from '@/app/router/navigation'
import { departmentDistribution } from '@/features/dashboard/data/dashboardData'
import { leaveService } from '@/features/leave/services/leave.service'
import { useLeaveApplications } from '@/features/leave/hooks/useLeaveApplications'
import type { LeaveApplication } from '@/features/leave/types/leave.types'
import type { ModuleRow } from '@/features/shared/data/moduleData'

export default function AttendanceInsights({ rows }: { rows: ModuleRow[] }) {
  const requests = useLeaveApplications()
  const pending: LeaveApplication[] = requests.filter((request) => request.status === 'Pending').slice(0, 4)
  const departmentCounts = rows
    .filter((row) => row.status === 'Absent')
    .reduce<Record<string, number>>((counts, row) => {
      counts[row.department] = (counts[row.department] ?? 0) + 1
      return counts
    }, {})
  const data = Object.entries(departmentCounts).map(([name, value], index) => {
    const normalizedName = name === 'People' ? 'HR' : name
    const headcount =
      departmentDistribution.find((department) => department.name === normalizedName)?.count ?? 0
    return {
      name,
      value,
      rate: headcount ? (value / headcount) * 100 : 0,
      color: ['#10B981', '#34D399', '#0F766E', '#6EE7B7'][index % 4],
    }
  })
  const update = async (request: LeaveApplication) => {
    if (!window.confirm(`Approve ${request.employeeName}’s ${request.leaveType.toLowerCase()} request?`)) return
    try {
      await leaveService.updateStatus(request.id, 'Approved')
      toast.success('Leave request approved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve the leave request.')
    }
  }
  return (
    <div className="attendance-insights-column">
      <section className="card absenteeism-card" aria-labelledby="absenteeism-title">
        <div className="attendance-section-heading">
          <div>
            <span className="eyebrow">TEAM HEALTH</span>
            <h2 id="absenteeism-title">Absenteeism rate</h2>
          </div>
        </div>
        {data.length ? (
          <div className="absenteeism-layout">
            <div className="absenteeism-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [
                      `${Number(value)} absent · ${Number(props.payload.rate).toFixed(1)}%`,
                      'Today',
                    ]}
                    contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 9 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="attendance-donut-center">
                <strong>{data.reduce((sum, item) => sum + item.value, 0)}</strong>
                <span>absent</span>
              </div>
            </div>
            <div className="absenteeism-legend">
              {data.map((item) => (
                <div key={item.name}>
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <b>{item.rate.toFixed(1)}%</b>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="attendance-insights-empty">
            No absent attendance records for this selection.
          </p>
        )}
      </section>
      <section className="card pending-approvals-card" aria-labelledby="pending-approvals-title">
        <div className="attendance-section-heading">
          <div>
            <span className="eyebrow">LEAVE MANAGEMENT</span>
            <h2 id="pending-approvals-title">Pending leave requests</h2>
          </div>
          <button
            className="button"
            type="button"
            onClick={() => navigateTo('/app/leave/approvals')}
          >
            All requests
          </button>
        </div>
        {pending.length ? (
          <div className="pending-approval-list">
            {pending.map((request) => (
              <article key={request.id}>
                <div className="pending-approval-person">
                  <strong>{request.employeeName}</strong>
                  <span>
                    {request.leaveType} · {request.numberOfDays} days
                  </span>
                  <small>
                    {request.startDate} – {request.endDate}
                  </small>
                </div>
                <div className="pending-approval-actions">
                  <button
                    type="button"
                    aria-label={`Approve ${request.employeeName} leave request`}
                    title="Approve"
                    onClick={() => void update(request)}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Review ${request.employeeName} leave request`}
                    title="Review and decide"
                    onClick={() => navigateTo(`/app/leave/${encodeURIComponent(request.id)}`)}
                  >
                    <X size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="attendance-insights-empty">No leave requests are waiting for review.</p>
        )}
      </section>
    </div>
  )
}
