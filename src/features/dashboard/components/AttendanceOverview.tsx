import { useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartTooltip from './ChartTooltip'
import { attendanceDateKey, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { leaveService } from '@/features/leave/services/leave.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

export default function AttendanceOverview() {
  useHRMDataChange()
  const [chartWidth, setChartWidth] = useState(0)
  const records = listAttendanceRows()
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayLeaves = leaveService.list().filter((leave) => leave.status === 'Approved' && leave.startDate <= todayKey && leave.endDate >= todayKey).length
  const attendanceSummary = [
    { key: 'present', label: 'Present Today', value: records.filter((row) => attendanceDateKey(row) === todayKey && ['Present', 'Late', 'Half Day'].includes(row.status)).length },
    { key: 'absent', label: 'Absent Today', value: records.filter((row) => attendanceDateKey(row) === todayKey && row.status === 'Absent').length },
    { key: 'on-leave', label: 'On Leave', value: todayLeaves },
    { key: 'late', label: 'Late', value: records.filter((row) => attendanceDateKey(row) === todayKey && row.status === 'Late').length },
  ]
  const attendanceWeekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const dayRecords = records.filter((row) => attendanceDateKey(row) === dayKey)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      present: dayRecords.filter((row) => row.status === 'Present' || row.status === 'Half Day').length,
      absent: dayRecords.filter((row) => row.status === 'Absent').length,
      late: dayRecords.filter((row) => row.status === 'Late').length,
    }
  })
  const maxAttendance = Math.max(1, ...attendanceWeekly.flatMap((item) => [item.present, item.absent, item.late]))
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)
  return (
    <section className="card attendance-chart-card">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">ATTENDANCE</span>
          <h3 className="section-title">Weekly attendance</h3>
          <p>Present, absent, and late check-ins this week</p>
        </div>
        <span className="chart-period">{weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <div className="attendance-summary" aria-label="Today's attendance summary">
        {attendanceSummary.map((item) => <div className={`attendance-summary-item attendance-summary-item--${item.key}`} key={item.key}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </div>
      <div className="attendance-chart" role="group" aria-label="Weekly attendance chart showing present, absent, and late employees from Monday to Sunday">
        <ResponsiveContainer width="100%" height="100%" onResize={(width) => setChartWidth(width)}>
          <ComposedChart data={attendanceWeekly} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 5" vertical={false} />
            <XAxis dataKey="day" tickFormatter={(day: string) => chartWidth < 520 ? day.slice(0, 3) : day} interval={chartWidth < 520 ? 'preserveStartEnd' : 0} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: chartWidth < 520 ? 9 : 10 }} dy={9} />
            <YAxis yAxisId="employees" domain={[0, maxAttendance]} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} />
            <YAxis yAxisId="events" orientation="right" domain={[0, maxAttendance]} hide />
            <Tooltip content={ChartTooltip} cursor={{ stroke: '#d8e4dc', strokeDasharray: '4 4' }} animationDuration={180} />
            <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: '#6e7a72', paddingBottom: 5 }} />
            <Line yAxisId="employees" type="monotone" dataKey="present" name="Present" stroke="var(--chart-present)" strokeWidth={2.7} dot={{ r: 3.5, fill: 'var(--chart-present)', stroke: '#fffefa', strokeWidth: 1.5 }} activeDot={{ r: 5.5, fill: 'var(--chart-present)', stroke: '#fffefa', strokeWidth: 2 }} />
            <Line yAxisId="events" type="monotone" dataKey="absent" name="Absent" stroke="var(--chart-absent)" strokeWidth={2.2} dot={{ r: 3.5, fill: 'var(--chart-absent)', stroke: '#fffefa', strokeWidth: 1.5 }} activeDot={{ r: 5.5, fill: 'var(--chart-absent)', stroke: '#fffefa', strokeWidth: 2 }} />
            <Line yAxisId="events" type="monotone" dataKey="late" name="Late" stroke="var(--chart-late)" strokeWidth={2.2} dot={{ r: 3.5, fill: 'var(--chart-late)', stroke: '#fffefa', strokeWidth: 1.5 }} activeDot={{ r: 5.5, fill: 'var(--chart-late)', stroke: '#fffefa', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
