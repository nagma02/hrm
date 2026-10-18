import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { attendanceDateKey, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

export default function MonthlyAttendanceTrends() {
  useHRMDataChange()
  const rows = listAttendanceRows()
  const now = new Date()
  const monthlyAttendanceTrends = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    const data = rows.filter((row) => {
      const recordedAt = new Date(`${attendanceDateKey(row)}T12:00:00`)
      return recordedAt.getFullYear() === date.getFullYear() && recordedAt.getMonth() === date.getMonth()
    })
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      present: data.filter((row) => row.status === 'Present' || row.status === 'Half Day').length,
      absent: data.filter((row) => row.status === 'Absent').length,
      late: data.filter((row) => row.status === 'Late').length,
    }
  })
  return <section className="card dashboard-visual-card" aria-labelledby="monthly-attendance-title">
    <div className="chart-heading"><div><span className="eyebrow">SIX MONTHS</span><h3 className="section-title" id="monthly-attendance-title">Monthly attendance trends</h3><p>Present, absent, and late records</p></div></div>
    <div className="monthly-attendance-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyAttendanceTrends} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 11 }}/><Tooltip contentStyle={{ border: '1px solid #CFEBD7', borderRadius: 10, backgroundColor: '#FFFFFF' }} formatter={(value, name) => [Number(value), String(name).replace(/^./, (letter) => letter.toUpperCase())]}/>
      <Bar dataKey="present" stackId="attendance" fill="var(--chart-present)" radius={[0, 0, 4, 4]} animationDuration={700}/><Bar dataKey="absent" stackId="attendance" fill="var(--chart-absent)" animationDuration={700}/><Bar dataKey="late" stackId="attendance" fill="var(--chart-late)" radius={[5, 5, 0, 0]} animationDuration={700}/>
    </BarChart></ResponsiveContainer></div>
    <div className="dashboard-chart-legend"><span><i style={{background:'var(--chart-present)'}}/>Present</span><span><i style={{background:'var(--chart-absent)'}}/>Absent</span><span><i style={{background:'var(--chart-late)'}}/>Late</span></div>
    {!rows.length && <small className="dashboard-data-note">No attendance records are available for this period.</small>}
  </section>
}
