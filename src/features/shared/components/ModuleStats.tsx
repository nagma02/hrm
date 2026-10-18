import type { ReactNode } from 'react'
import type { CSSProperties } from 'react'
import { BriefcaseBusiness, CalendarDays, CircleAlert, Clock3, CreditCard, Layers3, Users } from 'lucide-react'
import { attendanceSummary } from '@/features/dashboard/data/dashboardData'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { designationCounts, payrollTrend, shiftAssignmentCounts, type ModuleRow } from '../data/moduleData'

type ModuleStatsProps = { module: string; rows: ModuleRow[] }
type Stat = { label: string; value: string | number; caption: string; icon: ReactNode }

function stat(label: string, value: string | number, caption: string, icon: ReactNode): Stat {
  return { label, value, caption, icon }
}

export default function ModuleStats({ module, rows }: ModuleStatsProps) {
  // Live headcount from the employee store (the old static total showed 248 for a 7-person demo).
  const departmentTotal = useEmployees().length
  const pending = rows.filter((row) => row.status === 'Pending').length
  const active = rows.filter((row) => row.status === 'Active').length
  const stats: Stat[] = module === 'attendance'
    ? [
        stat('Present Today', attendanceSummary.find((item) => item.key === 'present')?.value ?? 0, 'Checked in', <Users size={15}/>),
        stat('Absent Today', attendanceSummary.find((item) => item.key === 'absent')?.value ?? 0, 'Scheduled today', <CircleAlert size={15}/>),
        stat('Late Today', attendanceSummary.find((item) => item.key === 'late')?.value ?? 0, 'Late check-ins', <Clock3 size={15}/>),
        stat('On Leave', attendanceSummary.find((item) => item.key === 'on-leave')?.value ?? 0, 'Approved leave', <CalendarDays size={15}/>),
      ]
    : module === 'leave'
      ? [
          stat('Total Requests', rows.length, 'All leave applications', <Layers3 size={15}/>),
          stat('Pending', pending, 'Awaiting review', <Clock3 size={15}/>),
          stat('Approved', rows.filter((row) => row.status === 'Approved').length, 'Approved requests', <CalendarDays size={15}/>),
          stat('Rejected', rows.filter((row) => row.status === 'Rejected').length, 'Declined requests', <CircleAlert size={15}/>),
        ]
      : module === 'shifts'
        ? [
            stat('Total Shifts', rows.length, 'Configured schedules', <Clock3 size={15}/>),
            stat('Active Shifts', active, 'Currently available', <CalendarDays size={15}/>),
            stat('Employees Assigned', rows.reduce((total, row) => total + (shiftAssignmentCounts[row.id] ?? 0), 0), 'Across active shifts', <Users size={15}/>),
            stat('Today’s Coverage', active, 'Active shifts on the schedule', <CircleAlert size={15}/>),
          ]
        : module === 'departments'
          ? [
              stat('Total Departments', rows.length, 'Teams in the directory', <Layers3 size={15}/>),
              stat('Active Departments', active, 'Currently operating', <CalendarDays size={15}/>),
              stat('Total Employees', departmentTotal, 'Across all teams', <Users size={15}/>),
              stat('Average Team Size', rows.length ? Math.round(departmentTotal / rows.length) : 0, 'Employees per department', <BriefcaseBusiness size={15}/>),
            ]
          : module === 'designations'
            ? [
                stat('Total Designations', rows.length, 'Defined job titles', <Layers3 size={15}/>),
                stat('Active Designations', rows.filter((row) => row.status === 'Active').length, 'Currently in use', <BriefcaseBusiness size={15}/>),
                stat('Employees Assigned', rows.reduce((total, row) => total + (designationCounts[row.id] ?? Number(row.detail.match(/(\d+) employees?/)?.[1] ?? 0)), 0), 'Across listed designations', <Users size={15}/>),
                stat('Departments Covered', new Set(rows.filter((row) => row.status === 'Active').map((row) => row.department)).size, 'With active roles', <CalendarDays size={15}/>),
              ]
            : module === 'payroll'
              ? [
                  stat('Total Payroll', `$${payrollTrend.at(-1)?.amount.toLocaleString() ?? '0'}`, 'October 2026', <CreditCard size={15}/>),
                  stat('Paid', `$${rows.filter((row) => row.status === 'Processed' || row.status === 'Paid' || row.status === 'Approved').reduce((sum, row) => sum + Number(row.detail.replace(/[^\d.]/g, '')), 0).toLocaleString()}`, 'Processed employees', <CalendarDays size={15}/>),
                  stat('Pending', `$${rows.filter((row) => row.status === 'Pending').reduce((sum, row) => sum + Number(row.detail.replace(/[^\d.]/g, '')), 0).toLocaleString()}`, 'Awaiting payment', <Clock3 size={15}/>),
                  stat('Employees Processed', rows.filter((row) => row.status === 'Processed' || row.status === 'Paid' || row.status === 'Approved').length, 'This pay period', <Users size={15}/>),
                ]
              : [
                  stat('Total Records', rows.length, 'In this workspace', <Layers3 size={15}/>),
                  stat('Active', active, 'Currently active', <CalendarDays size={15}/>),
                  stat('Pending', pending, 'Needs review', <Clock3 size={15}/>),
                ]

  if (module === 'designations') {
    const assigned = rows.reduce((total, row) => total + (designationCounts[row.id] ?? Number(row.detail.match(/(\d+) employees?/)?.[1] ?? 0)), 0)
    const totalDepartments = new Set(rows.map((row) => row.department)).size
    const ringStats = [
      { label: 'Total Designations', value: rows.length, caption: 'Defined job titles', percent: rows.length ? 100 : 0, icon: <Layers3 size={15}/> },
      { label: 'Active Designations', value: rows.filter((row) => row.status === 'Active').length, caption: 'Currently in use', percent: rows.length ? rows.filter((row) => row.status === 'Active').length / rows.length * 100 : 0, icon: <BriefcaseBusiness size={15}/> },
      { label: 'Employees Assigned', value: assigned, caption: 'Across listed designations', percent: departmentTotal ? assigned / departmentTotal * 100 : 0, icon: <Users size={15}/> },
      { label: 'Departments Covered', value: totalDepartments, caption: 'With listed roles', percent: departmentDistributionLength(totalDepartments), icon: <CalendarDays size={15}/> },
    ]
    return <div className={`stat-grid module-stat-grid module-stat-grid--${module}`}>
      {ringStats.map((item) => <div className="stat-tile designation-ring-tile" key={item.label}><div className="designation-ring" style={{ '--ring-progress': `${Math.min(100, item.percent)}%` } as CSSProperties}><span>{item.icon}</span></div><div className="designation-ring-copy"><span>{item.label}</span><strong>{item.value}</strong><small>{item.caption}</small></div></div>)}
    </div>
  }

  return <div className={`stat-grid module-stat-grid module-stat-grid--${module}`}>
    {stats.map((item) => <div className="stat-tile" key={item.label}><div className="stat-tile-top"><span>{item.label}</span><span className="stat-icon">{item.icon}</span></div><strong>{item.value}</strong><small>{item.caption}</small></div>)}
  </div>
}

function departmentDistributionLength(covered: number) {
  return Math.min(100, covered / 6 * 100)
}
