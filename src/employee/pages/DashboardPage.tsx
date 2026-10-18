import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowRight, BriefcaseBusiness, CalendarDays, CalendarPlus, CheckCircle2, Clock3, RefreshCw, Search, Umbrella, UserRound, XCircle } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '@/app/providers/use-auth'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { attendanceDateKey, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { leaveService } from '@/features/leave/services/leave.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { navigateTo } from '@/app/router/navigation'
import PageContainer from '@/features/shared/PageContainer'
import StatsCard from '@/features/dashboard/components/StatsCard'

const COLORS = { Present: 'var(--chart-present)', Late: 'var(--chart-late)', Absent: 'var(--chart-absent)', 'On Leave': 'var(--chart-leave)', WFH: 'var(--chart-present)', 'Half-day': 'var(--chart-neutral)' }
const todayKey = () => format(new Date(), 'yyyy-MM-dd')
const monthKey = (date: Date) => format(date, 'yyyy-MM')
const statusClass = (status: string) => status.toLowerCase().replaceAll(' ', '-')
type Balance = { type: string; entitled: number; used: number; carryForward: number }
type Announcement = { id: string; title: string; description: string; category: string; priority: string; publishDate: string; requiresAcknowledgement?: boolean }

function getEmployeeSeed(employeeId: string) {
  try {
    const rows = JSON.parse(localStorage.getItem('hrm-employee-ess-seed') ?? '[]') as Array<Record<string, unknown>>
    return rows.find((row) => row.employeeId === employeeId)
  } catch { return undefined }
}

function getAnnouncements(): Announcement[] {
  try {
    const content = JSON.parse(localStorage.getItem('hrm-content') ?? '{}') as { announcements?: Announcement[] }
    return (content.announcements ?? []).filter((item) => new Date(`${item.publishDate}T23:59:59`) <= new Date()).sort((a, b) => b.publishDate.localeCompare(a.publishDate))
  } catch { return [] }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { employeeId, employee } = useEmployeeRecord()
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : user?.name || 'Employee'
  useHRMDataChange()
  const now = Date.now()
  const [, setSeedReady] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>(getAnnouncements)
  const attendanceRows = listAttendanceRows().filter((row) => row.employeeId === employeeId)
  const leaveRows = leaveService.list().filter((row) => row.employeeId === employeeId)
  const dateKey = todayKey()
  const monthPrefix = dateKey.slice(0, 7)
  const employeeSeed = employee ? getEmployeeSeed(employee.id) : undefined
  const balances = (employeeSeed?.leaveBalances as Balance[] | undefined) ?? []

  useEffect(() => {
    const refresh = () => setAnnouncements(getAnnouncements())
    window.addEventListener('hrm:data-change', refresh)
    const startupRefresh = window.setTimeout(() => { refresh(); setSeedReady(true) }, 0)
    return () => { window.clearTimeout(startupRefresh); window.removeEventListener('hrm:data-change', refresh) }
  }, [])

  const thisMonth = attendanceRows.filter((row) => attendanceDateKey(row).startsWith(monthPrefix))
  const countStatus = (status: string) => thisMonth.filter((row) => row.status.toLowerCase() === status.toLowerCase()).length
  const totalBalance = balances.reduce((sum, item) => sum + Math.max(0, item.entitled + item.carryForward - item.used), 0)
  const approvedThisMonth = leaveRows.filter((row) => row.status === 'Approved' && row.startDate.startsWith(monthPrefix))
  const pendingRequests = leaveRows.filter((row) => row.status === 'Pending' && row.appliedDate.startsWith(monthPrefix))
  const todayGreeting = new Date(now).getHours() < 12 ? 'Good morning' : new Date(now).getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const upcomingHoliday = (() => {
    try {
      const content = JSON.parse(localStorage.getItem('hrm-content') ?? '{}') as { holidays?: Array<{ name: string; date: string; type: string }> }
      return (content.holidays ?? []).filter((holiday) => holiday.date >= dateKey).sort((a, b) => a.date.localeCompare(b.date))[0]
    } catch { return undefined }
  })()
  const attendanceBreakdown = ['Present', 'Late', 'Absent', 'On Leave', 'WFH', 'Half-day'].map((status) => ({ name: status, value: countStatus(status), color: COLORS[status as keyof typeof COLORS] })).filter((item) => item.value > 0)
  const sixMonthTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now); date.setDate(1); date.setMonth(date.getMonth() - 5 + index)
    const month = date.toLocaleDateString(undefined, { month: 'short' })
    const prefix = monthKey(date)
    const rows = attendanceRows.filter((row) => attendanceDateKey(row).startsWith(prefix))
    return { month, prefix, present: rows.filter((row) => ['Present', 'WFH'].includes(row.status)).length, late: rows.filter((row) => row.status === 'Late').length, leave: rows.filter((row) => row.status === 'On Leave').length, absent: rows.filter((row) => row.status === 'Absent').length, halfDay: rows.filter((row) => row.status === 'Half-day').length }
  })
  const weeklyHours = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now); date.setDate(date.getDate() - 6 + index)
    const key = format(date, 'yyyy-MM-dd')
    const row = attendanceRows.find((item) => attendanceDateKey(item) === key)
    const hours = row?.checkInAt && row.checkOutAt ? Math.max(0, (new Date(row.checkOutAt).getTime() - new Date(row.checkInAt).getTime()) / 3_600_000 - (row.breakMinutes ?? 60) / 60) : 0
    return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), hours: Number(hours.toFixed(1)) }
  })
  const nextHolidayDays = upcomingHoliday ? Math.max(0, Math.ceil((new Date(`${upcomingHoliday.date}T12:00:00`).getTime() - new Date(`${dateKey}T12:00:00`).getTime()) / 86_400_000)) : undefined
  const upcomingLeave = leaveRows.filter((row) => row.status === 'Approved' && row.startDate >= dateKey).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
  const weekEvents = employeeStore.getSnapshot().flatMap((colleague) => {
    const events: Array<{ id: string; name: string; label: string; date: string }> = []
    const inThisWeek = (value: string) => {
      if (!value) return false
      const date = new Date(`${value}T12:00:00`)
      const today = new Date(now)
      const end = new Date(today); end.setDate(today.getDate() + 7)
      const nextOccurrence = new Date(today.getFullYear(), date.getMonth(), date.getDate(), 12)
      if (nextOccurrence < today) nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1)
      return nextOccurrence >= today && nextOccurrence < end
    }
    if (colleague.dateOfBirth && inThisWeek(colleague.dateOfBirth)) events.push({ id: `${colleague.id}-birthday`, name: `${colleague.firstName} ${colleague.lastName}`, label: 'Birthday', date: colleague.dateOfBirth })
    if (inThisWeek(colleague.joinDate)) events.push({ id: `${colleague.id}-anniversary`, name: `${colleague.firstName} ${colleague.lastName}`, label: 'Work anniversary', date: colleague.joinDate })
    return events
  }).sort((a, b) => a.id.localeCompare(b.id))
  const latestActivity = [
    ...attendanceRows.map((row) => ({ id: row.id, date: attendanceDateKey(row), label: 'Attendance', detail: row.detail, status: row.status, time: row.checkOutAt ?? row.checkInAt })),
    ...leaveRows.map((row) => ({ id: row.id, date: row.appliedDate, label: 'Leave request', detail: `${row.leaveType} · ${row.reason}`, status: row.status, time: row.appliedDate })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  const monthNumber = (prefix: string) => sixMonthTrend.find((month) => month.prefix === prefix)
  const previousDate = new Date(now); previousDate.setDate(1); previousDate.setMonth(previousDate.getMonth() - 1)
  const previousPrefix = monthKey(previousDate)
  const previousAttendance = monthNumber(previousPrefix)
  const requestCountForMonth = (prefix: string) => leaveRows.filter((row) => row.status === 'Pending' && row.appliedDate.startsWith(prefix)).length
  const approvedDaysForMonth = (prefix: string) => leaveRows.filter((row) => row.status === 'Approved' && row.startDate.startsWith(prefix)).reduce((sum, row) => sum + row.numberOfDays, 0)
  const percentChange = (current: number, previous: number) => previous ? Math.round(((current - previous) / previous) * 100) : current ? 100 : 0
  const monthSeries = (key: 'present' | 'late' | 'absent' | 'leave' | 'halfDay') => sixMonthTrend.map((month) => key === 'leave' ? approvedDaysForMonth(month.prefix) : month[key])
  const stats = [
    { label: 'Present Days', value: countStatus('Present') + countStatus('WFH'), icon: <CheckCircle2 size={16}/>, hint: 'This month', change: percentChange(countStatus('Present') + countStatus('WFH'), previousAttendance?.present ?? 0), sparkline: monthSeries('present') },
    { label: 'Late Marks', value: countStatus('Late'), icon: <Clock3 size={16}/>, hint: 'This month', change: percentChange(countStatus('Late'), previousAttendance?.late ?? 0), sparkline: monthSeries('late') },
    { label: 'Absent Days', value: countStatus('Absent'), icon: <XCircle size={16}/>, hint: 'This month', change: percentChange(countStatus('Absent'), previousAttendance?.absent ?? 0), sparkline: monthSeries('absent') },
    { label: 'Leaves Taken', value: approvedThisMonth.reduce((sum, row) => sum + row.numberOfDays, 0), icon: <Umbrella size={16}/>, hint: 'Approved this month', change: percentChange(approvedDaysForMonth(monthPrefix), approvedDaysForMonth(previousPrefix)), sparkline: monthSeries('leave') },
    { label: 'Leave Balance', value: `${totalBalance} days`, icon: <CalendarDays size={16}/>, hint: `${balances.reduce((sum, item) => sum + item.entitled + item.carryForward, 0) ? Math.round(totalBalance / balances.reduce((sum, item) => sum + item.entitled + item.carryForward, 0) * 100) : 0}% remaining`, sparkline: sixMonthTrend.map((month) => Math.max(0, balances.reduce((sum, item) => sum + item.entitled + item.carryForward, 0) - leaveRows.filter((row) => row.status === 'Approved' && row.startDate <= `${month.prefix}-31`).reduce((sum, row) => sum + row.numberOfDays, 0))) },
    { label: 'Pending Requests', value: pendingRequests.length, icon: <BriefcaseBusiness size={16}/>, hint: 'Submitted this month', change: percentChange(pendingRequests.length, requestCountForMonth(previousPrefix)), sparkline: sixMonthTrend.map((month) => requestCountForMonth(month.prefix)) },
  ]

  return (
    <PageContainer>
      <div className="employee-dashboard-page w-full min-h-screen bg-white !px-6 lg:!px-8 !pt-0 !pb-6 lg:!pb-8 !gap-3.5 !-mx-6 lg:!-mx-8">
        <header className="page-header dashboard-header">
          <div>
            <p className="eyebrow">{new Date(now).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
            <h1 className="section-title !text-2xl !font-bold !tracking-tight">Welcome back, {employee?.firstName ?? employeeName.split(' ')[0]}</h1>
            <div>{todayGreeting} · {employee?.title ?? 'Employee'}{employee?.dept ? ` · ${employee.dept}` : ''}</div>
          </div>
          <div className="dashboard-actions flex items-center !gap-3 sm:!gap-4 flex-wrap mt-2 sm:mt-0">
            <label className="dashboard-search"><Search size={15}/><input aria-label="Search this dashboard" placeholder="Search anything..." onKeyDown={(event) => {
              if (event.key !== 'Enter' || !event.currentTarget.value.trim()) return
              const query = event.currentTarget.value.trim().toLowerCase()
              const match = Array.from(document.querySelectorAll<HTMLElement>('.employee-dashboard-page article, .employee-dashboard-page > section'))
                .find((section) => section.innerText.toLowerCase().includes(query))
              match?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}/></label>
            <button className="button header__ghost-button !h-8 !min-h-8 !rounded-lg !px-3 !text-xs" type="button" onClick={() => window.location.reload()}><RefreshCw size={14}/> Refresh</button>
            <a className="button header__primary-button !h-8 !min-h-8 !rounded-lg !px-3 !text-xs" href="/employee/leave"><CalendarPlus size={15}/> Apply Leave</a>
          </div>
        </header>

        <section className="dashboard-grid employee-dashboard-kpis w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5" aria-label="Monthly summary">
          {stats.map((stat) => <StatsCard key={stat.label} {...stat}/>) }
        </section>

        <section className="dashboard-visual-grid w-full grid !grid-cols-1 lg:!grid-cols-12 !gap-3">
          <article className="card dashboard-visual-card w-full lg:col-span-6 !rounded-2xl !border-slate-100 !bg-white !p-4 lg:!p-5 !shadow-sm"><div className="chart-heading"><div><span className="eyebrow">THIS MONTH</span><h2 className="section-title !text-base !font-bold !tracking-tight">Attendance breakdown</h2><p className="!text-[11px]">Your recorded workday statuses</p></div></div>
            {attendanceBreakdown.length ? <div className="attendance-donut-layout"><div className="attendance-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendanceBreakdown} dataKey="value" nameKey="name" innerRadius="65%" outerRadius="88%" paddingAngle={4} cornerRadius={5} stroke="#FFFFFF" strokeWidth={3} isAnimationActive={false}>{attendanceBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ border: '1px solid #CFEBD7', borderRadius: 12, backgroundColor: '#FFFFFF', boxShadow: '0 12px 26px rgb(27 54 43 / 13%)' }}/></PieChart></ResponsiveContainer><div className="attendance-donut-center"><strong className="!text-3xl !font-bold !text-slate-900">{thisMonth.length}</strong><span className="!text-xs !text-slate-500">days</span></div></div><div className="attendance-donut-legend">{attendanceBreakdown.map((item) => <div key={item.name}><i style={{ backgroundColor: item.color }}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <p className="empty-state">No attendance entries are available for this month.</p>}
          </article>
          <article className="card dashboard-visual-card w-full lg:col-span-6 !rounded-2xl !border-slate-100 !bg-white !p-4 lg:!p-5 !shadow-sm"><div className="chart-heading"><div><span className="eyebrow">SIX MONTHS</span><h2 className="section-title !text-base !font-bold !tracking-tight">Monthly attendance trend</h2><p className="!text-[11px]">Present, late, absent and leave days</p></div></div><div className="monthly-attendance-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={sixMonthTrend} barCategoryGap="25%" margin={{ top: 10, right: 8, left: -12, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 11 }} dy={7}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 10 }}/><Tooltip cursor={{ fill: '#E6F4EA', opacity: .45 }} contentStyle={{ border: '1px solid #CFEBD7', borderRadius: 12, backgroundColor: '#FFFFFF', boxShadow: '0 12px 26px rgb(27 54 43 / 13%)' }}/><Legend verticalAlign="bottom" align="left" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: 'var(--chart-label)', paddingTop: 12 }}/><Bar dataKey="present" name="Present / WFH" stackId="a" fill="var(--chart-present)" radius={[0,0,4,4]} isAnimationActive={false}/><Bar dataKey="late" name="Late" stackId="a" fill="var(--chart-neutral)" isAnimationActive={false}/><Bar dataKey="leave" name="Approved leave days" stackId="a" fill="var(--chart-leave)" isAnimationActive={false}/><Bar dataKey="absent" name="Absent" stackId="a" fill="var(--chart-absent)" isAnimationActive={false}/><Bar dataKey="halfDay" name="Half-day" stackId="a" fill="var(--chart-late)" radius={[5,5,0,0]} isAnimationActive={false}/></BarChart></ResponsiveContainer></div></article>
        </section>

        <section className="dashboard-pair w-full grid !grid-cols-1 lg:!grid-cols-12 !gap-3">
          <article className="card dashboard-visual-card lg:col-span-6"><div className="chart-heading"><div><span className="eyebrow">LAST SEVEN DAYS</span><h2 className="section-title">Weekly working hours</h2><p>Hours recorded after breaks</p></div></div><div className="monthly-attendance-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeklyHours} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 11 }} dy={7}/><YAxis domain={[0, 12]} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 10 }}/><Tooltip cursor={{ stroke: 'var(--chart-neutral)', strokeDasharray: '4 4' }} contentStyle={{ border: '1px solid #CFEBD7', borderRadius: 12, backgroundColor: '#FFFFFF', boxShadow: '0 12px 26px rgb(27 54 43 / 13%)' }} formatter={(value) => [`${value} hrs`, 'Worked']}/><Line type="monotone" dataKey="hours" stroke="var(--chart-present)" strokeWidth={3} dot={{ r: 3.5, fill: 'var(--chart-present)', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 5, fill: 'var(--chart-present)', stroke: '#FFFFFF', strokeWidth: 2 }} isAnimationActive={false}/></LineChart></ResponsiveContainer></div></article>
          <article className="card dashboard-visual-card lg:col-span-6"><div className="chart-heading"><div><span className="eyebrow">MY TIME OFF</span><h2 className="section-title">Leave overview</h2><p>Used and remaining balance by type</p></div><button className="text-action" type="button" onClick={() => navigateTo('/employee/leave')}>View leave <ArrowRight size={14}/></button></div><div className="employee-balance-list" style={{ display: 'grid', gap: 13 }}>{balances.map((balance) => { const total = balance.entitled + balance.carryForward; const used = balance.used; const remaining = Math.max(0, total - used); return <div key={balance.type} className="employee-balance-row"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}><span>{balance.type}</span><strong>{used} used · {remaining} left</strong></div><div className="employee-balance-track" role="progressbar" aria-label={`${balance.type} leave used`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(used, total)} style={{ height: 7, overflow: 'hidden', borderRadius: 99, background: 'var(--chart-grid)' }}><span style={{ display: 'block', width: `${total ? Math.min(100, used / total * 100) : 0}%`, height: '100%', borderRadius: 99, background: 'var(--chart-present)' }}/></div></div> })}{!balances.length && <p className="empty-state">No leave balance records are available.</p>}</div></article>
        </section>

        <section className="dashboard-pair !gap-3">
          <article className="card dashboard-visual-card"><div className="chart-heading"><div><span className="eyebrow">UP NEXT</span><h2 className="section-title">Coming up</h2></div><button className="text-action" type="button" onClick={() => navigateTo('/employee/holidays')}>Calendar <ArrowRight size={14}/></button></div><div className="employee-upcoming-list" style={{ display: 'grid', gap: 12 }}>{upcomingHoliday && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="employee-upcoming-icon"><CalendarDays size={17}/></span><span style={{ flex: 1 }}><strong>{upcomingHoliday.name}</strong><small>{new Date(`${upcomingHoliday.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {nextHolidayDays} days away</small></span><span className="badge badge--info">Holiday</span></div>}{upcomingLeave && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="employee-upcoming-icon"><Umbrella size={17}/></span><span style={{ flex: 1 }}><strong>{upcomingLeave.leaveType}</strong><small>{upcomingLeave.startDate} – {upcomingLeave.endDate}</small></span><span className="badge badge--success">Approved</span></div>}{weekEvents.map((event) => <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="employee-upcoming-icon"><UserRound size={17}/></span><span style={{ flex: 1 }}><strong>{event.name} · {event.label}</strong><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></span></div>)}{!upcomingHoliday && !upcomingLeave && !weekEvents.length && <p className="empty-state">No upcoming holidays, approved leave, or team milestones.</p>}</div></article>
          <article className="card dashboard-visual-card"><div className="chart-heading"><div><span className="eyebrow">COMPANY UPDATES</span><h2 className="section-title">Latest announcements</h2></div><button className="text-action" type="button" onClick={() => navigateTo('/employee/announcements')}>View all <ArrowRight size={14}/></button></div><div className="employee-announcement-list" style={{ display: 'grid', gap: 10 }}>{announcements.slice(0, 3).map((item) => <button type="button" key={item.id} onClick={() => navigateTo('/employee/announcements')} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 9, textAlign: 'left' }}><span className="badge badge--info">{item.category}</span><strong>{item.title}</strong><small>{new Date(`${item.publishDate}T12:00:00`).toLocaleDateString()}</small></button>)}{!announcements.length && <p className="empty-state">No announcements are available right now.</p>}</div></article>
        </section>

        <section className="card dashboard-visual-card employee-activity-card"><div className="chart-heading"><div><span className="eyebrow">YOUR PORTAL</span><h2 className="section-title">Recent activity</h2></div><span className="badge badge--info">{latestActivity.length} updates</span></div><div style={{ display: 'grid', gap: 0 }}>{latestActivity.map((item) => <article key={`${item.label}-${item.id}`} style={{ display: 'grid', gridTemplateColumns: '12px minmax(100px, 150px) minmax(0, 1fr) auto', alignItems: 'start', gap: 12, padding: '12px 0', borderBottom: '1px solid #E2E8F0' }}><span aria-hidden="true" style={{ width: 9, height: 9, marginTop: 5, borderRadius: 99, background: item.status === 'Rejected' ? '#E6F4EA' : item.status === 'Pending' ? '#1B362B' : 'var(--chart-present)' }}/><strong>{item.label}</strong><span><span>{item.detail}</span><small style={{ display: 'block', color: 'var(--chart-label)', marginTop: 3 }}>{item.time && !item.time.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(item.time).toLocaleString() : item.date}</small></span><span className={`status-pill status-${statusClass(item.status)}`}>{item.status}</span></article>)}{!latestActivity.length && <p className="empty-state">No recent activity is available for your employee account.</p>}</div></section>
      </div>
    </PageContainer>
  )
}
