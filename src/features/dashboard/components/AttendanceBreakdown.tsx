import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { attendanceDateKey, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { leaveService } from '@/features/leave/services/leave.service'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

export default function AttendanceBreakdown() {
  useHRMDataChange()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const employees = useEmployees()
  const rows = listAttendanceRows().filter((row) => attendanceDateKey(row) === today)
  const approvedLeave = leaveService.list().filter((row) => row.status === 'Approved' && row.startDate <= today && row.endDate >= today)
  const present = rows.filter((row) => row.status === 'Present' || row.status === 'Half Day').length
  const late = rows.filter((row) => row.status === 'Late').length
  const absent = rows.filter((row) => row.status === 'Absent').length
  const onLeave = approvedLeave.length
  const attendanceBreakdown = [
    { name: 'Present', value: present, color: 'var(--chart-present)' },
    { name: 'On Leave', value: onLeave, color: 'var(--chart-leave)' },
    { name: 'Late', value: late, color: 'var(--chart-late)' },
    { name: 'Absent', value: absent, color: 'var(--chart-absent)' },
  ]
  const total = attendanceBreakdown.reduce((sum, entry) => sum + entry.value, 0)
  return <section className="card dashboard-visual-card" aria-labelledby="attendance-breakdown-title">
    <div className="chart-heading"><div><span className="eyebrow">TODAY</span><h3 className="section-title" id="attendance-breakdown-title">Attendance breakdown</h3><p>Team status across today’s shift</p></div></div>
    <div className="attendance-donut-layout"><div className="attendance-donut">
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendanceBreakdown} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="88%" paddingAngle={4} cornerRadius={5} stroke="#fffefa" strokeWidth={3}>{attendanceBreakdown.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip formatter={(value, name) => [`${Number(value)} employees`, name]} contentStyle={{ border: '1px solid #d9d8cc', borderRadius: 12, backgroundColor: '#fffefa', boxShadow: '0 12px 26px rgb(53 55 47 / 13%)' }}/></PieChart></ResponsiveContainer>
      <div className="attendance-donut-center"><strong>{total}</strong><span>employees</span></div>
    </div><div className="attendance-donut-legend">{attendanceBreakdown.map((item) => <div key={item.name}><i style={{ backgroundColor: item.color }}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div>
    <small className="dashboard-data-note">Recorded statuses: {total} of {employees.filter((employee) => employee.status.toLowerCase() !== 'inactive').length} active employees. Unrecorded employees are not assumed absent.</small>
  </section>
}
