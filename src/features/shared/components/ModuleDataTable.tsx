import { Check, Eye, Pencil, Power, Printer, Trash2, X } from 'lucide-react'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import {
  departmentManagers,
  designationCounts,
  type ModuleRow,
} from '../data/moduleData'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '@/features/payroll/services/payroll.service'

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
  const actions = (row: ModuleRow) =>
    module === 'designations' ? (
      <div className="row-actions designation-row-actions">
        <button
          title="View designation"
          aria-label={`View ${row.name}`}
          onClick={() => onView?.(row)}
        >
          <Eye size={15} />
        </button>
        <button
          title="Edit designation"
          aria-label={`Edit ${row.name}`}
          onClick={() => onEdit?.(row)}
        >
          <Pencil size={15} />
        </button>
        <button
          title={row.status === 'Active' ? 'Deactivate designation' : 'Activate designation'}
          aria-label={`${row.status === 'Active' ? 'Deactivate' : 'Activate'} ${row.name}`}
          onClick={() => onToggleStatus?.(row)}
        >
          <Power size={15} />
        </button>
        <button
          title="Delete designation"
          aria-label={`Delete ${row.name}`}
          onClick={() => onAction(row, 'delete')}
        >
          <Trash2 size={15} />
        </button>
      </div>
    ) : ['shifts', 'departments'].includes(module) ? (
      <div className="row-actions">
        {module === 'departments' && <button title="View department" aria-label={`View ${row.name}`} onClick={() => onView?.(row)}><Eye size={15}/></button>}
        <button
          title={`Edit ${module === 'shifts' ? 'shift' : 'department'}`}
          aria-label={`Edit ${row.name}`}
          onClick={() => onEdit?.(row)}
        >
          <Pencil size={15} />
        </button>
        <button
          title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
          aria-label={`${row.status === 'Active' ? 'Deactivate' : 'Activate'} ${row.name}`}
          onClick={() => onToggleStatus?.(row)}
        ><Power size={15}/></button>
        <button
          title="Delete record"
          aria-label={`Delete ${row.name}`}
          onClick={() => onAction(row, 'delete')}
        >
          <Trash2 size={15} />
        </button>
      </div>
    ) : (
      <div className="row-actions">
        {module === 'payroll' && (
          <button
            title="View printable payslip"
            aria-label={`View payslip for ${row.name}`}
            onClick={() => onView?.(row)}
          >
            <Printer size={15} />
          </button>
        )}
        {module === 'attendance' && (
          <>
            <button
              title="View attendance details"
              aria-label={`View attendance details for ${row.name}`}
              onClick={() => navigateTo(`/app/attendance/${encodeURIComponent(row.id)}`)}
            >
              <Eye size={15} />
            </button>
            <button
              title="Request an attendance correction"
              aria-label={`Request attendance correction for ${row.name}`}
              onClick={() =>
                navigateTo(`/app/attendance/corrections?record=${encodeURIComponent(row.id)}`)
              }
            >
              <Pencil size={15} />
            </button>
          </>
        )}
        {row.status === 'Pending' && (
          <>
            <button
              title={module === 'payroll' ? 'Mark as paid' : 'Approve'}
              aria-label={`${module === 'payroll' ? 'Mark as paid' : 'Approve'} ${row.name}`}
              onClick={() => onAction(row, 'approve')}
            >
              <Check size={15} />
            </button>
            <button
              title="Reject"
              aria-label={`Reject ${row.name}`}
              onClick={() => onAction(row, 'reject')}
            >
              <X size={15} />
            </button>
          </>
        )}
        <button
          title="Delete record"
          aria-label={`Delete ${row.name}`}
          onClick={() => onAction(row, 'delete')}
        >
          <Trash2 size={16} />
        </button>
      </div>
    )

  if (module === 'attendance')
    return (
      <table className="hr-table module-table attendance-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
            <th>Working hours</th>
            <th>Location</th>
            <th>Overtime</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const times = attendanceTimes(row.detail, row.status)
            const employee = employees.find((item) => `${item.firstName} ${item.lastName}`.toLowerCase() === row.name.toLowerCase())
            const payroll = payrollService.list().find((item) => item.employeeId === employee?.id)
            return (
              <tr key={row.id}>
                <td>
                  <PersonCell row={row} />
                </td>
                <td>{row.date}</td>
                <td>{times.checkIn}</td>
                <td>{times.checkOut}</td>
                <td>
                  <span
                    className={`status-pill status-${row.status.toLowerCase().replaceAll(' ', '-')}`}
                  >
                    <i />
                    {row.status}
                  </span>
                </td>
                <td>{times.hours}</td>
                <td>{employee?.location ?? '—'}</td>
                <td>{payroll ? `${payroll.overtimeHours}h` : '—'}</td>
                <td>{actions(row)}</td>
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
