import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { attendanceWeekly } from '@/features/dashboard/data/dashboardData'
import { payrollTrend } from '../data/moduleData'

type AnalyticsModule = 'attendance' | 'payroll'

export default function ModuleAnalytics({ module }: { module: AnalyticsModule }) {
  if (module === 'attendance') {
    return <section className="panel module-analytics">
      <div className="module-analytics-heading"><div><span className="eyebrow">ATTENDANCE</span><h2>Weekly Attendance Trend</h2><p>Present, absent, and late check-ins this week</p></div><span className="analytics-period">Oct 5 – Oct 11</span></div>
      <div className="module-chart attendance-module-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={attendanceWeekly} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="day" tickFormatter={(day: string) => day.slice(0, 3)} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--chart-label)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ border: '1px solid #d9d8cc', borderRadius: 9, backgroundColor: '#fffefa', boxShadow: '0 8px 22px rgb(53 55 47 / 10%)', fontSize: 12 }} />
        <Line type="monotone" dataKey="present" name="Present" stroke="var(--chart-present)" strokeWidth={2.4} dot={{ r: 3, fill: 'var(--chart-present)' }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="absent" name="Absent" stroke="var(--chart-absent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-absent)' }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="late" name="Late" stroke="var(--chart-late)" strokeWidth={2} dot={{ r: 3, fill: 'var(--chart-late)' }} activeDot={{ r: 5 }} />
      </LineChart></ResponsiveContainer></div>
      <div className="module-chart-legend"><span><i className="legend-dot legend-dot--present"/>Present</span><span><i className="legend-dot legend-dot--absent"/>Absent</span><span><i className="legend-dot legend-dot--late"/>Late</span></div>
    </section>
  }

  return <section className="panel module-analytics">
    <div className="module-analytics-heading"><div><span className="eyebrow">PAYROLL</span><h2>Monthly Payroll Trend</h2><p>Total payroll by month</p></div><span className="analytics-period">May – Oct 2026</span></div>
    <div className="module-chart payroll-module-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={payrollTrend} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
      <defs><linearGradient id="payrollAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-present)" stopOpacity={0.2}/><stop offset="100%" stopColor="var(--chart-present)" stopOpacity={0.015}/></linearGradient></defs>
      <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="month" tick={{ fill: 'var(--chart-label)', fontSize: 12 }} axisLine={false} tickLine={false}/>
      <YAxis tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} axisLine={false} tickLine={false}/>
      <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Payroll']} contentStyle={{ border: '1px solid #d9d8cc', borderRadius: 9, backgroundColor: '#fffefa', boxShadow: '0 8px 22px rgb(53 55 47 / 10%)', fontSize: 12 }}/>
      <Area type="monotone" dataKey="amount" stroke="var(--chart-present)" strokeWidth={2.3} fill="url(#payrollAreaFill)" dot={{ r: 3, fill: 'var(--chart-present)' }} activeDot={{ r: 5 }}/>
    </AreaChart></ResponsiveContainer></div>
  </section>
}
