import { Check, Eye, Pencil, Power, Printer, Trash2, X } from 'lucide-react'
import { ActionDropdown, type ActionDropdownItem } from '@/components/ui/action-dropdown'
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
    <div className="person-cell">
      <span className="avatar-mini">{initials(row.name)}</span>
      <span>
        <b>{row.name}</b>
        <small>{row.id}</small>
      </span>
    </div>
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
  const departmentCount = (name: string) => employees.filter((employee) => employee.status.toLowerCase() !== 'inactive' && (employee.dept === name || (name === 'People & Culture' && employee.dept === 'HR'))).length
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
        label: row.status === 'Active' ? 'Deactivate' : 'Activate',
        icon: <Power size={14} />,
        onClick: () => onToggleStatus?.(row),
      })
      items.push({ label: 'Delete record', icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    } else {
      if (module === 'payroll') {
        items.push({ label: 'View payslip', icon: <Printer size={14} />, onClick: () => onView?.(row) })
      }
      if (module === 'attendance') {
        items.push({ label: 'View attendance', icon: <Eye size={14} />, onClick: () => navigateTo(`/app/attendance/${encodeURIComponent(row.id)}`) })
        items.push({ label: 'Request correction', icon: <Pencil size={14} />, onClick: () => navigateTo(`/app/attendance/corrections?record=${encodeURIComponent(row.id)}`) })
      }
      if (row.status === 'Pending') {
        items.push({ label: module === 'payroll' ? 'Mark as paid' : 'Approve', icon: <Check size={14} />, onClick: () => onAction(row, 'approve') })
        items.push({ label: 'Reject', icon: <X size={14} />, onClick: () => onAction(row, 'reject') })
      }
      items.push({ label: 'Delete record', icon: <Trash2 size={14} />, destructive: true, onClick: () => onAction(row, 'delete') })
    }

    return items.length ? <ActionDropdown actions={items} label={`Actions for ${row.name}`} /> : null
  }

  if (module === 'attendance')
    return (
      <table className="hr-table module-table attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Dept</th>
            <th>Punch in / out</th>
            <th>Total hours</th>
            <th>OT</th>
            <th>Status</th>
            <th>View loca.</th>
            <th>View img</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const times = attendanceTimes(row.detail, row.status)
            const employee = employees.find((item) => `${item.firstName} ${item.lastName}`.toLowerCase() === row.name.toLowerCase())
            const payroll = payrollService.list().find((item) => item.employeeId === employee?.id)
            const checkIn = row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : times.checkIn
            const checkOut = row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : times.checkOut
            return (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td><div className="attendance-employee-cell"><span className="avatar-mini">{initials(row.name)}</span><span><b>{row.name}</b><small>{employee?.email ?? row.id}</small></span></div></td>
                <td>{row.department}</td>
                <td><div className="attendance-punch-times"><span>Punch In: {checkIn}</span><small>Punch Out: {checkOut}</small></div></td>
                <td>{times.hours}</td>
                <td>{payroll ? `${payroll.overtimeHours}h` : '—'}</td>
                <td>
                  <span
                    className={`status-pill status-${row.status.toLowerCase().replaceAll(' ', '-')}`}
                  >
                    <i />
                    {row.status}
                  </span>
                </td>
                <td><PunchLocationCell location={row.punchLocation} /></td>
                <td><PunchPhotoCell photo={row.punchPhoto} name={row.name} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )

  if (module === 'shifts')
    return (
      <table className="hr-table module-table shift-table">
        <thead>
          <tr>
            <th>Shift name</th>
            <th>Hours</th>
            <th>Schedule</th>
            <th>Employees assigned</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <b className="table-primary-text">{row.name}</b>
                <small className="table-secondary-text">{row.id}</small>
              </td>
              <td>{row.department}</td>
              <td>{row.detail}</td>
              <td>{countCell(row)}</td>
              <td>
                <span className={`status-pill status-${row.status.toLowerCase()}`}>
                  <i />
                  {row.status}
                </span>
              </td>
              <td>{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

  if (module === 'departments')
    return (
      <table className="hr-table module-table department-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Employees</th>
            <th>Active employees</th>
            <th>Open positions</th>
            <th>Manager</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <b className="table-primary-text">{row.name}</b>
                <small className="table-secondary-text">{row.id}</small>
              </td>
              <td>{departmentCount(row.name)}</td>
              <td>{employees.filter((employee) => (employee.dept === row.name || (row.name === 'People & Culture' && employee.dept === 'HR')) && employee.status === 'Active').length}</td>
              <td>—</td>
              <td>{departmentManagers[row.name] ?? row.department ?? 'Unassigned'}</td>
              <td>{row.detail}</td>
              <td>
                <span className={`status-pill status-${row.status.toLowerCase()}`}>
                  <i />
                  {row.status}
                </span>
              </td>
              <td>{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

  if (module === 'designations')
    return (
      <table className="hr-table module-table designation-table">
        <thead>
          <tr>
            <th>Designation</th>
            <th>Department</th>
            <th>Employee count</th>
            <th>Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <b className="table-primary-text">{row.name}</b>
                <small className="table-secondary-text">{row.id}</small>
              </td>
              <td>{row.department}</td>
              <td>{countCell(row)}</td>
              <td>{row.detail.split('·')[0]?.trim() || '—'}</td>
              <td>
                <span className={`status-pill status-${row.status.toLowerCase()}`}>
                  <i />
                  {row.status}
                </span>
              </td>
              <td>{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

  if (module === 'payroll')
    return (
      <table className="hr-table module-table payroll-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Salary</th>
            <th>Pay period</th>
            <th>Payment date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <PersonCell row={row} />
              </td>
              <td className="table-primary-text">{row.detail}</td>
              <td>{row.date}</td>
              <td>
                {['Processed', 'Paid', 'Approved'].includes(row.status)
                  ? 'Oct 01, 2026'
                  : 'Not scheduled'}
              </td>
              <td>
                <span className={`status-pill status-${status(row.status).toLowerCase()}`}>
                  <i />
                  {status(row.status)}
                </span>
              </td>
              <td>{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )

  return (
    <table className="hr-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Department / details</th>
          <th>Date</th>
          <th>Details</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <PersonCell row={row} />
            </td>
            <td>{row.department}</td>
            <td>{row.date}</td>
            <td>{row.detail}</td>
            <td>
              <span
                className={`status-pill status-${row.status.toLowerCase().replaceAll(' ', '-')}`}
              >
                <i />
                {status(row.status)}
              </span>
            </td>
            <td>{actions(row)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
