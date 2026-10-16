import React from 'react'
import StatsCard from './StatsCard'
import { Users, CheckCircle, UserPlus, Briefcase, CalendarCheck, XCircle } from 'lucide-react'
import { kpiStats } from '../data/dashboardData'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { navigateTo } from '@/app/router/navigation'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { leaveService } from '@/features/leave/services/leave.service'

const iconMap: Record<string, React.ReactNode> = {
  total: <Users size={16} />,
  present: <CheckCircle size={16} />,
  onLeave: <CalendarCheck size={16} />,
  absent: <XCircle size={16} />,
  new: <UserPlus size={16} />,
}

export default function StatsGrid() {
  useHRMDataChange()
  const employees = useEmployees()
  const attendance = listAttendanceRows()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayAttendance = attendance.filter((row) => row.dateKey === today)
  const month = today.slice(0, 7)
  const activeEmployees = employees.filter((employee) => employee.status.toLowerCase() !== 'inactive')
  const currentLeaves = leaveService.list()
  const values: Record<string, number> = {
    total: activeEmployees.length,
    present: todayAttendance.filter((row) => ['Present', 'Late', 'Half Day'].includes(row.status)).length,
    onLeave: currentLeaves.filter((row) => row.status === 'Approved' && row.startDate <= today && row.endDate >= today).length,
    absent: todayAttendance.filter((row) => row.status === 'Absent').length,
    new: activeEmployees.filter((employee) => employee.joinDate.startsWith(month)).length,
  }
  const destinations: Record<string, string> = { total: '/app/employees', present: '/app/attendance', onLeave: '/app/leave', absent: '/app/attendance', new: '/app/employees?new=month' }
  return (
    <div className="dashboard-grid">
      {kpiStats.map((s) => (
        <StatsCard key={s.key} icon={iconMap[s.key]} label={s.key === 'total' ? 'Active Employees' : s.label} value={values[s.key] ?? 0} change={0} onClick={() => navigateTo(destinations[s.key])} />
      ))}
    </div>
  )
}
