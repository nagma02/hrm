import { useParams } from 'react-router-dom'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '@/features/payroll/services/payroll.service'

export function AttendanceDetailsPage() {
  const { id = '' } = useParams()
  const row = listAttendanceRows().find((entry) => entry.id === id)
  if (!row)
    return (
      <PageContainer>
        <PageHeader
          title="Attendance record not found"
          subtitle="The selected record may have been removed."
        />
        <button className="button" onClick={() => navigateTo('/app/attendance')}>
          Back to attendance
        </button>
      </PageContainer>
    )
  const [checkIn = '—', checkOut = '—'] = row.detail.split('—').map((part) => part.trim())
  const payroll = payrollService.list().find((entry) => entry.employeeName === row.name)
  const attendance = payroll ? { working: payroll.workingDays, present: payroll.paidDays, paidLeave: Math.max(0, payroll.paidDays - payroll.workingDays + payroll.unpaidDays), unpaid: payroll.unpaidDays, late: row.status === 'Late' ? 1 : 0, overtime: payroll.overtimeHours, lop: payroll.lossOfPay } : { working: 1, present: row.status === 'Present' || row.status === 'Late' ? 1 : 0, paidLeave: row.status === 'On Leave' ? 1 : 0, unpaid: row.status === 'Absent' ? 1 : 0, late: row.status === 'Late' ? 1 : 0, overtime: 0, lop: 0 }
  const timesheet = [{ date: row.date, in: checkIn, out: checkOut, status: row.status }]
  return (
    <PageContainer>
      <PageHeader
        title="Attendance details"
        subtitle={`${row.name} · ${row.id}`}
        actions={
          <button
            className="button primary"
            onClick={() =>
              navigateTo(`/app/attendance/corrections?record=${encodeURIComponent(row.id)}`)
            }
          >
            Request correction
          </button>
        }
      />
      <section className="card attendance-record-details">
        <dl>
          <div>
            <dt>Employee</dt>
            <dd>{row.name}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{row.department}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{row.date}</dd>
          </div>
          <div>
            <dt>Check-in</dt>
            <dd>{checkIn}</dd>
          </div>
          <div>
            <dt>Check-out</dt>
            <dd>{checkOut}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{row.status}</dd>
          </div>
        </dl>
      </section>
      <section className="panel attendance-month-summary">
        <div><span className="eyebrow">PAYROLL INPUT · OCTOBER 2026</span><h2>Monthly attendance summary</h2><p>Mock attendance and leave totals used by the payroll preview.</p></div>
        <div className="attendance-month-stats">{[['Working days', attendance.working], ['Present', attendance.present], ['Absent', attendance.unpaid], ['Paid leave', attendance.paidLeave], ['Late days', attendance.late], ['Overtime', `${attendance.overtime}h`], ['Loss of pay', `$${attendance.lop}`]].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}</div>
      </section>
      <section className="panel attendance-timesheet"><div className="panel-head"><div><span className="eyebrow">ATTENDANCE RECORD</span><h2>{row.date}</h2></div><span>Personal record</span></div><div className="table-scroll"><table className="hr-table"><thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead><tbody>{timesheet.map((entry) => <tr key={entry.date}><td>{entry.date}</td><td>{entry.in}</td><td>{entry.out}</td><td>{entry.status}</td></tr>)}</tbody></table></div></section>
      <button className="button" onClick={() => navigateTo('/app/attendance')}>
        Back to attendance
      </button>
    </PageContainer>
  )
}
