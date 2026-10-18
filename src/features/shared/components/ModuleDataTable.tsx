import { Check, Eye, Pencil, Power, Printer, Trash2, X } from 'lucide-react'
import { ActionDropdown, type ActionDropdownItem } from '@/components/ui/action-dropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusDotBadge } from '@/components/tables/StatusDotBadge'
import { AccentCell } from '@/components/tables/AccentCell'
import { EntityCell } from '@/components/tables/EntityCell'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import {
  departmentManagers,
  designationCounts,
  type ModuleRow,
} from '../data/moduleData'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { PunchLocationCell, PunchPhotoCell } from '@/features/attendance/components/PunchProofCells'

type Props = {
  module: string
  rows: ModuleRow[]
  onAction: (row: ModuleRow, action: 'approve' | 'reject' | 'delete') => void
  onView?: (row: ModuleRow) => void
  onEdit?: (row: ModuleRow) => void
  onToggleStatus?: (row: ModuleRow) => void
}

function attendanceTimes(detail: string, status: string) {
  const parts = detail.split('—').map((value) => value.trim())
  if (parts.length < 2)
    return { checkIn: status === 'On Leave' ? 'On leave' : '—', checkOut: '—', hours: '—' }
  const toMinutes = (value: string) => {
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!match) return null
    let hours = Number(match[1]) % 12
    if (match[3].toUpperCase() === 'PM') hours += 12
    return hours * 60 + Number(match[2])
  }
  const start = toMinutes(parts[0])
  const end = toMinutes(parts[1])
  const total = start !== null && end !== null && end >= start ? end - start : null
  return {
    checkIn: parts[0],
    checkOut: parts[1],
    hours: total === null ? '—' : `${Math.floor(total / 60)}h ${total % 60}m`,
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
}

function PersonCell({ row }: { row: ModuleRow }) {
  return (
    <EntityCell
      title={row.name}
      subtitle={row.id}
      tags={[{ label: 'INDIVIDUAL', variant: 'gray' }, { label: 'Active', variant: 'green' }]}
      avatar={
        <Avatar className="h-9 w-9 rounded-lg">
          <AvatarFallback className="rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
            {initials(row.name)}
          </AvatarFallback>
        </Avatar>
      }
    />
  )
}

export default function ModuleDataTable({
  module,
  rows,
  onAction,
  onView,
  onEdit,
  onToggleStatus,
}: Props) {
  const employees = useEmployees()
  const status = (value: string) =>
    module === 'payroll' && ['Processed', 'Approved'].includes(value) ? 'Paid' : value
  const departmentCount = (name: string) =>
    employees.filter(
      (employee) =>
        employee.status.toLowerCase() !== 'inactive' &&
        (employee.dept === name || (name === 'People & Culture' && employee.dept === 'HR'))
    ).length
  const countCell = (row: ModuleRow) =>
    module === 'departments'
      ? departmentCount(row.name)
      : module === 'designations'
        ? employees.filter((employee) => employee.status.toLowerCase() !== 'inactive' && employee.title === row.name).length
        : module === 'shifts'
          ? employees.filter((employee) => employee.status.toLowerCase() !== 'inactive' && employee.shift === row.name).length
          : (designationCounts[row.id] ?? Number(row.detail.match(/(\d+) employees?/)?.[1] ?? 0))

  const actions = (row: ModuleRow) => {
    const items: ActionDropdownItem[] = []

    if (module === 'designations') {
      items.push({ label: 'View designation', icon: <Eye size={14} />, onClick: () => onView?.(row) })
      items.push({ label: 'Edit designation', icon: <Pencil size={14} />, onClick: () => onEdit?.(row) })
      items.push({
        label: row.status === 'Active' ? 'Deactivate designation' : 'Activate designation',
        icon: <Power size={14} />,
        onClick: () => onToggleStatus?.(row),
      })
      items.push({ label: 'Delete designation', icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    } else if (['shifts', 'departments'].includes(module)) {
      if (module === 'departments') {
        items.push({ label: 'View department', icon: <Eye size={14} />, onClick: () => onView?.(row) })
      }
      items.push({ label: `Edit ${module === 'shifts' ? 'shift' : 'department'}`, icon: <Pencil size={14} />, onClick: () => onEdit?.(row) })
      items.push({
        label: row.status === 'Active' ? `Deactivate ${module === 'shifts' ? 'shift' : 'department'}` : `Activate ${module === 'shifts' ? 'shift' : 'department'}`,
        icon: <Power size={14} />,
        onClick: () => onToggleStatus?.(row),
      })
      items.push({ label: `Delete ${module === 'shifts' ? 'shift' : 'department'}`, icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    } else if (module === 'attendance') {
      items.push({ label: 'Edit attendance', icon: <Pencil size={14} />, onClick: () => onEdit?.(row) })
      items.push({ label: 'Remove attendance record', icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    } else if (module === 'payroll') {
      items.push({ label: 'View employee detail', icon: <Eye size={14} />, onClick: () => navigateTo(`/app/payroll/detail/${row.id}`) })
      items.push({ label: 'Print payslip', icon: <Printer size={14} />, onClick: () => window.print() })
    } else {
      if (['Pending', 'Requested'].includes(row.status)) {
        items.push({ label: 'Approve', icon: <Check size={14} />, onClick: () => onAction(row, 'approve') })
        items.push({ label: 'Reject', icon: <X size={14} />, destructive: true, onClick: () => onAction(row, 'reject') })
      }
      items.push({ label: 'Edit', icon: <Pencil size={14} />, onClick: () => onEdit?.(row) })
      items.push({ label: 'Delete', icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    }

    return items.length ? <ActionDropdown actions={items} label={`Actions for ${row.name}`} /> : null
  }

  if (module === 'attendance')
    return (
      <Table className="hr-table module-table attendance-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.NO</TableHead>
            <TableHead>Employee / User</TableHead>
            <TableHead>Dept</TableHead>
            <TableHead>Punch In / Out</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>OT</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Proof</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const times = attendanceTimes(row.detail, row.status)
            const employee = employees.find((item) => `${item.firstName} ${item.lastName}`.toLowerCase() === row.name.toLowerCase())
            const payroll = payrollService.list().find((item) => item.employeeId === employee?.id)
            const checkIn = row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : times.checkIn
            const checkOut = row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : times.checkOut
            return (
              <TableRow key={row.id}>
                <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
                <TableCell>
                  <EntityCell
                    title={row.name}
                    subtitle={employee?.email ?? row.id}
                    tags={[{ label: 'INDIVIDUAL', variant: 'gray' }, { label: employee?.dept ?? 'HR', variant: 'green' }]}
                    avatar={
                      <Avatar className="h-9 w-9 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                          {initials(row.name)}
                        </AvatarFallback>
                      </Avatar>
                    }
                  />
                </TableCell>
                <TableCell>
                  <AccentCell title={row.department} color="emerald" />
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-slate-700">
                    <div>In: <span className="font-medium text-slate-900">{checkIn}</span></div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Out: {checkOut}</div>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-800">{times.hours}</TableCell>
                <TableCell className="text-xs text-slate-500">{payroll ? `${payroll.overtimeHours}h` : '—'}</TableCell>
                <TableCell>
                  <StatusDotBadge status={row.status} />
                </TableCell>
                <TableCell><PunchLocationCell location={row.punchLocation} /></TableCell>
                <TableCell><PunchPhotoCell photo={row.punchPhoto} name={row.name} /></TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )

  if (module === 'shifts')
    return (
      <Table className="hr-table module-table shift-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.NO</TableHead>
            <TableHead>Shift Name</TableHead>
            <TableHead>Hours / Dept</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
              <TableCell>
                <AccentCell title={row.name} subtitle={row.id} color="emerald" />
              </TableCell>
              <TableCell className="text-xs text-slate-700">{row.department}</TableCell>
              <TableCell className="text-xs text-slate-600 font-mono">{row.detail}</TableCell>
              <TableCell className="text-xs font-semibold text-slate-800">{countCell(row)} staff</TableCell>
              <TableCell>
                <StatusDotBadge status={row.status} />
              </TableCell>
              <TableCell>{actions(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  if (module === 'departments')
    return (
      <Table className="hr-table module-table department-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.NO</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Total Staff</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
              <TableCell>
                <AccentCell
                  title={row.name}
                  subtitle={row.id}
                  color="emerald"
                />
              </TableCell>
              <TableCell className="text-xs font-medium text-slate-700">
                {departmentManagers[row.name] ?? row.department ?? 'Unassigned'}
              </TableCell>
              <TableCell className="text-xs font-semibold text-slate-800">{departmentCount(row.name)}</TableCell>
              <TableCell className="text-xs text-emerald-700 font-semibold">
                {employees.filter((employee) => (employee.dept === row.name || (row.name === 'People & Culture' && employee.dept === 'HR')) && employee.status === 'Active').length}
              </TableCell>
              <TableCell className="text-xs text-slate-500">{row.detail}</TableCell>
              <TableCell>
                <StatusDotBadge status={row.status} />
              </TableCell>
              <TableCell>{actions(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  if (module === 'designations')
    return (
      <Table className="hr-table module-table designation-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.NO</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Staff Count</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
              <TableCell>
                <AccentCell
                  title={row.name}
                  subtitle={row.id}
                  color="blue"
                />
              </TableCell>
              <TableCell className="text-xs text-slate-700">{row.department}</TableCell>
              <TableCell className="text-xs font-semibold text-slate-800">{countCell(row)}</TableCell>
              <TableCell className="text-xs text-slate-500">{row.detail.split('·')[0]?.trim() || '—'}</TableCell>
              <TableCell>
                <StatusDotBadge status={row.status} />
              </TableCell>
              <TableCell>{actions(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  if (module === 'payroll')
    return (
      <Table className="hr-table module-table payroll-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">S.NO</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Gross / Detail</TableHead>
            <TableHead>Pay Period</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.id}>
              <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
              <TableCell>
                <PersonCell row={row} />
              </TableCell>
              <TableCell className="font-semibold text-slate-900 text-xs">{row.detail}</TableCell>
              <TableCell className="text-xs text-slate-600">{row.date}</TableCell>
              <TableCell className="text-xs text-slate-500">
                {['Processed', 'Paid', 'Approved'].includes(row.status)
                  ? 'Oct 01, 2026'
                  : 'Not scheduled'}
              </TableCell>
              <TableCell>
                <StatusDotBadge status={status(row.status)} />
              </TableCell>
              <TableCell>{actions(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )

  return (
    <Table className="hr-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">S.NO</TableHead>
          <TableHead>Name / Entity</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={row.id}>
            <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
            <TableCell>
              <PersonCell row={row} />
            </TableCell>
            <TableCell>
              <AccentCell title={row.department} color="emerald" />
            </TableCell>
            <TableCell className="text-xs text-slate-600">{row.date}</TableCell>
            <TableCell className="text-xs text-slate-500">{row.detail}</TableCell>
            <TableCell>
              <StatusDotBadge status={status(row.status)} />
            </TableCell>
            <TableCell>{actions(row)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
