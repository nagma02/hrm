import { BriefcaseBusiness, Cake, CalendarDays, CircleAlert, UserPlus, Users, Wallet, ShieldCheck } from 'lucide-react'
import { hrInsights } from '../data/dashboardData'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { leaveService } from '@/features/leave/services/leave.service'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { navigateTo } from '@/app/router/navigation'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

const insightIcons = {
  employees: UserPlus,
  leave: CalendarDays,
  positions: BriefcaseBusiness,
  attendance: CircleAlert,
  birthday: Cake,
  payroll: Wallet,
  probation: ShieldCheck,
}

export default function HRInsights() {
  useHRMDataChange()
  const employees = useEmployees()
  const leaves = leaveService.list()
  const payroll = payrollService.list()
  const attendance = listAttendanceRows()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayAttendance = attendance.filter((row) => row.dateKey === today)
  const month = today.slice(0, 7)
  const values: Record<string, number> = {
    'new-employees': employees.filter((item) => item.joinDate.startsWith(month)).length,
    'pending-leave': leaves.filter((item) => item.status === 'Pending').length,
    'on-leave': leaves.filter((item) => item.status === 'Approved' && item.startDate <= today && item.endDate >= today).length,
    'attendance-issues': todayAttendance.filter((item) => item.status === 'Late' || item.status === 'Absent').length,
    'pending-payroll': payroll.filter((item) => !['Paid', 'Simulated', 'Failed'].includes(item.status)).length,
    'payroll-processed': payroll.filter((item) => item.status === 'Paid').length,
    probation: employees.filter((item) => item.status === 'Probation').length,
    'open-positions': 0,
    'upcoming-birthdays': employees.filter((item) => {
      if (!item.dateOfBirth) return false
      const [, monthValue, dayValue] = item.dateOfBirth.split('-').map(Number)
      const birthday = new Date(now.getFullYear(), monthValue - 1, dayValue)
      if (birthday < new Date(now.getFullYear(), now.getMonth(), now.getDate())) birthday.setFullYear(now.getFullYear() + 1)
      return birthday.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() <= 7 * 86400000
    }).length,
  }
  const destinations: Record<string, string> = { 'new-employees': '/app/employees?new=month', 'pending-leave': '/app/leave?status=Pending', 'on-leave': '/app/leave', 'attendance-issues': '/app/attendance', 'pending-payroll': '/app/payroll', 'payroll-processed': '/app/payroll', probation: '/app/employees' }
  return (
    <section className="card hr-insights-card" aria-labelledby="hr-insights-title">
      <div className="dashboard-section-heading">
        <div>
          <div className="badge badge--info">Workforce</div>
          <h3 className="section-title" id="hr-insights-title">HR Insights</h3>
        </div>
        <Users className="dashboard-section-icon" size={17} aria-hidden="true" />
      </div>

      <div className="hr-insights-list">
        {hrInsights.map((insight) => {
          const Icon = insightIcons[insight.icon]
          return (
            <button className="hr-insight-row hr-insight-row--clickable" key={insight.key} onClick={() => navigateTo(destinations[insight.key] ?? '/app/dashboard')}>
              <span className={`hr-insight-icon hr-insight-icon--${insight.tone}`} aria-hidden="true"><Icon size={14} /></span>
              <span className="hr-insight-label">{insight.label}</span>
              <strong className={`hr-insight-value hr-insight-value--${insight.tone}`}>{values[insight.key] ?? insight.value}</strong>
            </button>
          )
        })}
      </div>
    </section>
  )
}
