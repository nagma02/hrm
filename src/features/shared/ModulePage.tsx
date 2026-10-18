import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowUpRight, ClipboardList, Download, Plus, Printer, Search } from 'lucide-react'
import { toast } from 'sonner'
import { navigateTo } from '@/app/router/navigation'
import ModuleDataTable from './components/ModuleDataTable'
import ModuleStats from './components/ModuleStats'
import PageHeader from './PageHeader'
import { moduleSeeds, type ModuleRow } from './data/moduleData'
import ShiftSchedule from '@/features/shifts/components/ShiftSchedule'
import DepartmentDistribution from '@/features/departments/components/DepartmentDistribution'
import DesignationOverview from '@/features/designations/components/DesignationOverview'
import DepartmentDesignationAnalysis from '@/features/designations/components/DepartmentDesignationAnalysis'
import DesignationManagement from '@/features/designations/components/DesignationManagement'
import { sanitizeText } from '@/utils/sanitize-text'
import { buildCsv } from '@/utils/csv'
import LeaveBalanceRadials from '@/features/attendance/components/LeaveBalanceRadials'
import AttendanceCalendar from '@/features/attendance/components/AttendanceCalendar'
import AttendanceClockWidget from '@/features/attendance/components/AttendanceClockWidget'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { leaveService } from '@/features/leave/services/leave.service'
import { listAttendanceCorrections, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { useAuth } from '@/app/providers/use-auth'
import { changeAccountPassword } from '@/services/auth.service'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'
import { ChartCardSkeleton } from '@/components/ui/skeleton'

const labels: Record<string, string> = {
  attendance: 'Attendance',
  leave: 'Leave requests',
  shifts: 'Shift management',
  departments: 'Departments',
  designations: 'Designations',
  payroll: 'Payroll',
  settings: 'Settings',
  documents: 'Documents',
}

const analyticsModules = new Set(['attendance', 'payroll'])
const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const ModuleAnalytics = lazy(() => import('./components/ModuleAnalytics'))
const DesignationDistribution = lazy(
  () => import('@/features/designations/components/DesignationDistribution'),
)
const AttendanceInsights = lazy(() => import('@/features/attendance/components/AttendanceInsights'))

export default function ModulePage({ module, subroute }: { module: string; subroute?: string }) {
  const attendanceDataRevision = useHRMDataChange()
  const employees = useEmployees()
  const pendingCorrectionCount = useMemo(
    () => listAttendanceCorrections().filter((item) => item.status === 'Pending').length,
    [attendanceDataRevision],
  )
  const title = labels[module] ?? module
  const [rows, setRows] = useState<ModuleRow[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(`hrm-${module}`) || 'null') || moduleSeeds[module] || []
      )
    } catch {
      return moduleSeeds[module] || []
    }
  })
  const routeId =
    subroute === 'edit' ? window.location.pathname.split('/').filter(Boolean).at(-2) : undefined
  const initialEdit = routeId ? (rows.find((row) => row.id === routeId) ?? null) : null
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'department' | 'status'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [attendanceDepartment, setAttendanceDepartment] = useState('All departments')
  const [attendanceEmployee, setAttendanceEmployee] = useState('All employees')
  const [attendanceLocation, setAttendanceLocation] = useState('All locations')
  const [attendanceDate, setAttendanceDate] = useState(() => localDateKey())
  const [showForm, setShowForm] = useState(
    subroute === 'create' || subroute === 'apply' || Boolean(initialEdit),
  )
  const [editingRow, setEditingRow] = useState<ModuleRow | null>(initialEdit)
  const [viewingRow, setViewingRow] = useState<ModuleRow | null>(null)
  const [payslipRow, setPayslipRow] = useState<ModuleRow | null>(null)
  const [name, setName] = useState(initialEdit?.name ?? '')
  const [detail, setDetail] = useState(initialEdit?.department ?? '')
  const [reason, setReason] = useState(initialEdit?.detail ?? '')
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>(() => initialEdit && module === 'shifts' ? employees.filter((employee) => employee.shift === initialEdit.name).map((employee) => employee.id) : [])
  useEffect(() => {
    if (module !== 'attendance') return
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = window.setTimeout(() => setAttendanceDate(localDateKey()), Math.max(0, nextMidnight.getTime() - now.getTime()) + 50)
    return () => window.clearTimeout(timer)
  }, [module, attendanceDate])
  const sourceRows = module === 'attendance' ? listAttendanceRows() : rows
  const filtered = useMemo(
    () =>
      sourceRows.filter((row) => {
        const matchesQuery = `${row.name} ${row.id} ${row.department} ${row.detail}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const isPaid =
          module === 'payroll' &&
          filter === 'Paid' &&
          ['Processed', 'Paid', 'Approved'].includes(row.status)
        const person = employees.find((employee) => `${employee.firstName} ${employee.lastName}`.toLowerCase() === row.name.toLowerCase())
        const matchesDepartment = module !== 'attendance' || attendanceDepartment === 'All departments' || row.department === attendanceDepartment
        const matchesEmployee = module !== 'attendance' || attendanceEmployee === 'All employees' || row.name === attendanceEmployee
        const matchesLocation = module !== 'attendance' || attendanceLocation === 'All locations' || person?.location === attendanceLocation
        const isActualPunch = module !== 'attendance' || Boolean(row.employeeId && row.checkInAt)
        const rowDate = row.dateKey ?? (/^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : (() => { const parsed = new Date(row.date); return Number.isNaN(parsed.getTime()) ? '' : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` })())
        const matchesDate = module !== 'attendance' || rowDate === attendanceDate
        return matchesQuery && matchesDepartment && matchesEmployee && matchesLocation && matchesDate && isActualPunch && (filter === 'All' || row.status === filter || isPaid)
      }),
    [sourceRows, query, filter, module, attendanceDepartment, attendanceEmployee, attendanceLocation, attendanceDate, employees],
  )
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])
  const sorted = useMemo(() => [...filtered].sort((left, right) => {
    const leftValue = sortBy === 'date' ? left.date : left[sortBy]
    const rightValue = sortBy === 'date' ? right.date : right[sortBy]
    const result = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection === 'asc' ? result : -result
  }), [filtered, sortBy, sortDirection])
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const save = (next: ModuleRow[]) => {
    setRows(next)
    localStorage.setItem(`hrm-${module}`, JSON.stringify(next))
    window.dispatchEvent(new Event('hrm:data-change'))
  }

  const start = () => {
    if (module === 'employees') navigateTo('/app/employees/create')
    else if (module === 'leave') navigateTo('/app/leave/apply')
    else {
      if (module === 'shifts') setAssignedEmployeeIds([])
      if (module === 'designations') {
        setEditingRow(null)
        setName('')
        setDetail('')
        setReason('')
      }
      setShowForm(true)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter a name')
      return
    }
    const record: ModuleRow = {
      id: `${module.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: sanitizeText(name),
      department: sanitizeText(detail) || 'General',
      detail: sanitizeText(reason) || 'New record',
      date: new Date().toLocaleDateString(),
      status: module === 'leave' ? 'Pending' : module === 'attendance' ? 'Present' : 'Active',
    }
    if (editingRow) {
      save(
        rows.map((row) =>
          row.id === editingRow.id
            ? {
                ...editingRow,
                name: record.name,
                department: record.department,
                detail: record.detail,
              }
            : row,
        ),
      )
      if (module === 'shifts') employeeStore.save(employeeStore.getSnapshot().map((employee) => {
        if (assignedEmployeeIds.includes(employee.id)) return { ...employee, shift: record.name }
        if (employee.shift === editingRow.name) { const { shift: _previousShift, ...rest } = employee; return rest }
        return employee
      }))
      setShowForm(false)
      setEditingRow(null)
      setName('')
      setDetail('')
      setReason('')
      toast.success(`${title.slice(0, -1)} updated successfully`)
      return
    }
    save([record, ...rows])
    if (module === 'shifts' && assignedEmployeeIds.length) employeeStore.save(employeeStore.getSnapshot().map((employee) => assignedEmployeeIds.includes(employee.id) ? { ...employee, shift: record.name } : employee))
    setShowForm(false)
    setName('')
    setDetail('')
    setReason('')
    toast.success(`${title} saved successfully`)
  }

  const action = (row: ModuleRow, actionType: 'approve' | 'reject' | 'delete') => {
    if (actionType === 'delete') {
      const associated = module === 'departments'
        ? employees.filter((employee) => employee.dept === row.name || (row.name === 'People & Culture' && employee.dept === 'HR'))
        : module === 'designations'
          ? employees.filter((employee) => employee.title === row.name)
          : []
      if (associated.length) {
        toast.error(`Cannot delete ${row.name}; ${associated.length} employee record${associated.length === 1 ? '' : 's'} still use it. Reassign or edit them first.`)
        return
      }
      if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return
      save(rows.filter((item) => item.id !== row.id))
      if (module === 'shifts') employeeStore.save(employeeStore.getSnapshot().map((employee) => { if (employee.shift !== row.name) return employee; const { shift: _removedShift, ...rest } = employee; return rest }))
      toast.success('Record deleted')
      return
    }
    const nextStatus = actionType === 'approve' ? 'Approved' : 'Rejected'
    save(rows.map((item) => (item.id === row.id ? { ...item, status: nextStatus } : item)))
    toast.success(
      module === 'payroll' && actionType === 'approve'
        ? 'Payment marked as paid'
        : `Request ${actionType === 'approve' ? 'approved' : 'rejected'}`,
    )
  }

  const editDesignation = (row: ModuleRow) => {
    setEditingRow(row)
    setName(row.name)
    setDetail(row.department)
    setReason(row.detail)
    setShowForm(true)
  }

  const editRecord = (row: ModuleRow) => {
    setEditingRow(row)
    setName(row.name)
    setDetail(row.department)
    setReason(row.detail)
    if (module === 'shifts') setAssignedEmployeeIds(employees.filter((employee) => employee.shift === row.name).map((employee) => employee.id))
    setShowForm(true)
  }

  const toggleRecordStatus = (row: ModuleRow) => {
    const status = row.status === 'Active' ? 'Inactive' : 'Active'
    save(rows.map((item) => (item.id === row.id ? { ...item, status } : item)))
    toast.success(`${row.name} ${status === 'Active' ? 'activated' : 'deactivated'}.`)
  }

  const processPendingPayroll = () => {
    const pendingCount = rows.filter((row) => row.status === 'Pending').length
    if (!pendingCount) {
      toast.info('There are no pending payroll records to process.')
      return
    }
    save(rows.map((row) => (row.status === 'Pending' ? { ...row, status: 'Processed' } : row)))
    toast.success(`${pendingCount} payroll record${pendingCount === 1 ? '' : 's'} processed.`)
  }

  const exportRows = () => {
    const csv = buildCsv(
      ['ID', 'Name', 'Department', 'Details', 'Date', 'Status'],
      filtered.map((row) => [row.id, row.name, row.department, row.detail, row.date, row.status]),
    )
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = `${module}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Export downloaded')
  }

  if (module === 'settings')
    return (
      <div className="module-page">
        <PageHeader eyebrow="Preferences" title="Settings" subtitle="Manage your workspace and personal preferences." />
        <SettingsContent />
      </div>
    )

  const description =
    module === 'attendance'
      ? 'Monitor daily attendance, punctuality, and team coverage.'
      : module === 'leave'
        ? 'Review time off requests and balances.'
        : module === 'shifts'
          ? 'Plan team coverage and keep working hours easy to scan.'
          : module === 'departments'
            ? 'Organize teams, managers, and department headcount.'
            : module === 'designations'
              ? 'Manage job titles and the roles represented across teams.'
              : module === 'payroll'
                ? 'Review payroll trends and payment progress for this period.'
                : `Manage your organization's ${title.toLowerCase()}.`
  const listTitle =
    subroute === 'approvals'
      ? 'Requests awaiting approval'
      : subroute === 'reports'
        ? 'Payroll reports'
        : module === 'attendance'
          ? 'Today’s attendance'
          : module === 'payroll'
            ? 'October payroll'
            : module === 'shifts'
              ? 'Shift management'
              : module === 'departments'
                ? 'Department directory'
                : module === 'designations'
                  ? 'Designation directory'
                  : `All ${title.toLowerCase()}`

  return (
    <div className={`module-page module-page--${module}`}>
      <PageHeader
        eyebrow={title}
        title={subroute === 'approvals' ? 'Leave approvals' : subroute === 'correction' ? 'Attendance corrections' : title}
        subtitle={description}
        actions={<>
          {module === 'attendance' && (
            <>
              <button className="button" onClick={() => navigateTo('/app/attendance/corrections')}>
                <ClipboardList size={15} /> Review corrections{pendingCorrectionCount ? ` (${pendingCorrectionCount})` : ''}
              </button>
              <button className="button" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Mark attendance
              </button>
            </>
          )}
          {module === 'leave' && (
            <button className="button" onClick={start}>
              <Plus size={15} /> Apply for leave
            </button>
          )}
          {module === 'payroll' && (
            <button className="button primary" onClick={processPendingPayroll}>
              <ClipboardList size={15} /> Process pending
            </button>
          )}
          {['shifts', 'departments', 'designations'].includes(module) && (
            <button className="button primary" onClick={start}>
              <Plus size={15} />{' '}
              {module === 'designations'
                ? 'Create Designation'
                : module === 'departments'
                  ? 'Add Department'
                  : 'Add Shift'}
            </button>
          )}
        </>}
      />

      <ModuleStats module={module} rows={rows} />
      {module === 'shifts' && <ShiftSchedule rows={rows} />}
      {module === 'departments' && <DepartmentDistribution rows={rows} />}
      {module === 'designations' && (
        <>
          <div className="designation-overview-grid">
            <DesignationOverview rows={rows} />
            <Suspense
              fallback={<ChartCardSkeleton label="Loading designation distribution" />}
            >
              <DesignationDistribution rows={rows} />
            </Suspense>
          </div>
          <DepartmentDesignationAnalysis rows={rows} />
        </>
      )}
      {module === 'attendance' && (
        <>
          <AttendanceClockWidget />
          <LeaveBalanceRadials />
          <div className="attendance-insights-layout">
            <AttendanceCalendar rows={rows} />
            <Suspense
              fallback={<ChartCardSkeleton label="Loading attendance insights" />}
            >
              <AttendanceInsights rows={rows} />
            </Suspense>
          </div>
        </>
      )}
      {analyticsModules.has(module) && (
        <Suspense
          fallback={<ChartCardSkeleton label="Loading module insights" />}
        >
          <ModuleAnalytics module={module as 'attendance' | 'payroll'} />
        </Suspense>
      )}

      {module === 'designations' ? (
        <DesignationManagement
          rows={filtered}
          total={rows.length}
          query={query}
          filter={filter}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
          onExport={exportRows}
          onAction={action}
          onView={setViewingRow}
          onEdit={editDesignation}
          onToggleStatus={toggleRecordStatus}
        />
      ) : (
        <section className="panel data-panel">
          <div className="panel-head">
            <div>
              {['shifts', 'departments', 'designations'].includes(module) && (
                <span className="module-panel-kicker">WORKSPACE DIRECTORY</span>
              )}
              <h2>{listTitle}</h2>
              <span>{filtered.length} records</span>
            </div>
          <div className="table-tools">
              <label className="table-search">
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${title.toLowerCase()}...`}
                  aria-label={`Search ${title.toLowerCase()}`}
                />
              </label>
              <select
                aria-label="Filter by status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>All</option>
                {[
                  'Active',
                  'Pending',
                  'Approved',
                  'Rejected',
                  'Present',
                  'Absent',
                  'Late',
                  'On Leave',
                  'Processed',
                  'Paid',
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="module-sort">Sort records by</label>
              <select id="module-sort" aria-label="Sort records by" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
                <option value="name">Name</option><option value="date">Date</option><option value="department">Department</option><option value="status">Status</option>
              </select>
              <button type="button" className="button" aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`} onClick={() => setSortDirection((value) => value === 'asc' ? 'desc' : 'asc')}>{sortDirection === 'asc' ? 'A–Z' : 'Z–A'}</button>
              {module === 'attendance' && <><select aria-label="Filter attendance by employee" value={attendanceEmployee} onChange={(event)=>setAttendanceEmployee(event.target.value)}><option>All employees</option>{[...new Set(rows.map((row)=>row.name))].map((name)=><option key={name}>{name}</option>)}</select><select aria-label="Filter attendance by department" value={attendanceDepartment} onChange={(event)=>setAttendanceDepartment(event.target.value)}><option>All departments</option>{[...new Set(rows.map((row)=>row.department))].map((department)=><option key={department}>{department}</option>)}</select><select aria-label="Filter attendance by location" value={attendanceLocation} onChange={(event)=>setAttendanceLocation(event.target.value)}><option>All locations</option>{[...new Set(employees.map((employee)=>employee.location))].map((location)=><option key={location}>{location}</option>)}</select><input aria-label="Filter attendance by date" type="date" value={attendanceDate} onChange={(event)=>setAttendanceDate(event.target.value)} /></>}
              <button
                className="icon-button"
                title="Export CSV"
                aria-label="Export CSV"
                onClick={exportRows}
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="table-scroll">
            <ModuleDataTable
              module={module}
              rows={pageRows}
              onAction={action}
              onView={module === 'payroll' ? setPayslipRow : module === 'departments' ? setViewingRow : undefined}
              onEdit={editRecord}
              onToggleStatus={toggleRecordStatus}
            />
            {!filtered.length && (
              <div className="empty-state">
                <div className="empty-icon">
                  <ClipboardList size={22} />
                </div>
                <b>No records found</b>
                <span>Try adjusting your search or add a new record.</span>
              </div>
            )}
          </div>
          <div className="table-footer">
            <span>
              Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} matching records ({rows.length} total)
            </span>
            <div>
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
              <span className="current-page" aria-live="polite">{currentPage} / {pageCount}</span>
              <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
            </div>
          </div>
        </section>
      )}

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false)
              setEditingRow(null)
            }
          }}
        >
          <form className="form-modal" onSubmit={submit}>
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setShowForm(false)
                setEditingRow(null)
              }}
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow">{editingRow ? 'UPDATE RECORD' : 'NEW RECORD'}</p>
            <h2>
              {editingRow
                ? `Edit ${module === 'shifts' ? 'shift' : module === 'departments' ? 'department' : module === 'designations' ? 'designation' : title.slice(0, -1)}`
                : module === 'leave'
                  ? 'Apply for leave'
                  : module === 'attendance'
                    ? 'Mark attendance'
                    : `Create ${module === 'shifts' ? 'shift' : module === 'departments' ? 'department' : module === 'designations' ? 'designation' : title.slice(0, -1)}`}
            </h2>
            <label>
              {module === 'shifts'
                ? 'Shift name'
                : module === 'departments'
                  ? 'Department name'
                  : module === 'designations'
                    ? 'Designation title'
                    : 'Name / employee'}
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  module === 'designations' ? 'e.g. Senior Software Engineer' : 'Enter a name'
                }
              />
            </label>
            {module === 'shifts' && <label>Assign employees<select multiple value={assignedEmployeeIds} onChange={(event) => setAssignedEmployeeIds(Array.from(event.currentTarget.selectedOptions, (option) => option.value))}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} · {employee.id}</option>)}</select><small>Use Ctrl or Command to select multiple employees.</small></label>}
            <label>
              {module === 'attendance'
                ? 'Department'
                : module === 'departments'
                  ? 'Department manager'
                  : module === 'shifts'
                    ? 'Shift hours'
                    : 'Department'}
              <input
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder="Enter details"
              />
            </label>
            <label>
              {module === 'attendance'
                ? 'Check-in / check-out'
                : module === 'departments'
                  ? 'Location'
                  : module === 'shifts'
                    ? 'Breaks and work days'
                    : module === 'designations'
                      ? 'Level and details'
                      : 'Details'}
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Add notes"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingRow(null)
                }}
              >
                Cancel
              </button>
              <button className="button primary" type="submit">
                {editingRow ? 'Save changes' : 'Save record'}
              </button>
            </div>
          </form>
        </div>
      )}
      {viewingRow && module === 'designations' && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setViewingRow(null)}
        >
          <section
            className="designation-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="designation-view-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setViewingRow(null)}
              aria-label="Close designation details"
            >
              ×
            </button>
            <span className="designation-view-icon">
              <ArrowUpRight size={18} />
            </span>
            <p className="eyebrow">DESIGNATION DETAILS</p>
            <h2 id="designation-view-title">{viewingRow.name}</h2>
            <dl>
              <div>
                <dt>Department</dt>
                <dd>{viewingRow.department}</dd>
              </div>
              <div>
                <dt>Level and team size</dt>
                <dd>{viewingRow.detail}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`status-pill status-${viewingRow.status.toLowerCase()}`}>
                    <i />
                    {viewingRow.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{viewingRow.date}</dd>
              </div>
            </dl>
            <div className="modal-actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setViewingRow(null)
                  editDesignation(viewingRow)
                }}
              >
                Edit designation
              </button>
              <button type="button" className="button primary" onClick={() => setViewingRow(null)}>
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      {viewingRow && module === 'departments' && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setViewingRow(null)}>
          <section className="payslip-modal" role="dialog" aria-modal="true" aria-labelledby="department-detail-title">
            <button className="modal-close" aria-label="Close department details" onClick={() => setViewingRow(null)}>×</button>
            <span className="eyebrow">DEPARTMENT DETAILS</span><h2 id="department-detail-title">{viewingRow.name}</h2>
            <dl><div><dt>Department head</dt><dd>{viewingRow.department || 'Unassigned'}</dd></div><div><dt>Location</dt><dd>{viewingRow.detail || 'Not configured'}</dd></div><div><dt>Employees</dt><dd>{employees.filter((employee) => employee.dept === viewingRow.name || (viewingRow.name === 'People & Culture' && employee.dept === 'HR')).length}</dd></div><div><dt>Active employees</dt><dd>{employees.filter((employee) => (employee.dept === viewingRow.name || (viewingRow.name === 'People & Culture' && employee.dept === 'HR')) && employee.status === 'Active').length}</dd></div><div><dt>Designations</dt><dd>{[...new Set(employees.filter((employee) => employee.dept === viewingRow.name).map((employee) => employee.title))].join(', ') || 'Not configured'}</dd></div><div><dt>Approved leave requests</dt><dd>{leaveService.list().filter((leave) => (employees.some((employee) => employee.id === leave.employeeId && employee.dept === viewingRow.name)) && leave.status === 'Approved').length}</dd></div></dl>
            <div className="modal-actions"><button className="button" onClick={() => { setViewingRow(null); editRecord(viewingRow) }}>Edit department</button><button className="button primary" onClick={() => setViewingRow(null)}>Done</button></div>
          </section>
        </div>
      )}
      {payslipRow && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setPayslipRow(null)}
        >
          <section
            className="payslip-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payslip-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setPayslipRow(null)}
              aria-label="Close payslip"
            >
              ×
            </button>
            <span className="eyebrow">PAYROLL · {payslipRow.date}</span>
            <h2 id="payslip-title">Employee payslip</h2>
            <dl>
              <div>
                <dt>Employee</dt>
                <dd>{payslipRow.name}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{payslipRow.department}</dd>
              </div>
              <div>
                <dt>Gross pay</dt>
                <dd>{payslipRow.detail}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>{payslipRow.status}</dd>
              </div>
            </dl>
            <p className="payslip-demo-note">
              Demo payslip based on the payroll record shown in this workspace.
            </p>
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setPayslipRow(null)}>
                Close
              </button>
              <button type="button" className="button primary" onClick={() => window.print()}>
                <Printer size={15} /> Print payslip
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

const defaultRolePermissions: Record<string, boolean> = {
  'Super Admin:Settings:Manage': true,
  'Super Admin:Payroll:Manage': true,
  'HR Admin:Employees:View': true,
  'HR Admin:Employees:Edit': true,
  'HR Admin:Attendance:View': true,
  'HR Admin:Leave:Approve': true,
  'HR Admin:Payroll:Manage': true,
  'HR Manager:Employees:View': true,
  'HR Manager:Attendance:View': true,
  'HR Manager:Leave:Approve': true,
  'HR Manager:Payroll:View': true,
  'Manager:Employees:View': true,
  'Manager:Attendance:View': true,
  'Manager:Leave:Approve': true,
  'Employee:Employees:View': true,
  'Employee:Attendance:View': true,
  'Employee:Leave:View': true,
  'Employee:Payroll:View': true,
}
type AuditEntry = { time: string; actor: string; action: string; scope: string }
const sampleAudit: AuditEntry[] = [
  {
    time: '10:30 AM',
    actor: 'HR Administrator',
    action: 'Updated employee directory settings',
    scope: 'Employees',
  },
  {
    time: '09:45 AM',
    actor: 'HR Administrator',
    action: 'Approved a leave request',
    scope: 'Leave',
  },
  {
    time: 'Yesterday',
    actor: 'Manager',
    action: 'Reviewed attendance records',
    scope: 'Attendance',
  },
]

function readSettingsRecord<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

function SettingsContent() {
  const { user, updateUser, portal } = useAuth()
  const linkedEmployee = employeeStore.getSnapshot().find((employee) => employee.id === user?.employeeId || employee.email.toLowerCase() === user?.email.toLowerCase())
  const [tab, setTab] = useState('General')
  const [saved, setSaved] = useState(false)
  const userSettingsKey = `hrm-account-settings:${user?.id ?? 'guest'}`
  const [accountProfile, setAccountProfile] = useState(() => ({
    name: linkedEmployee ? `${linkedEmployee.firstName} ${linkedEmployee.lastName}` : user?.name ?? '',
    phone: linkedEmployee?.phone ?? user?.phone ?? '', jobTitle: linkedEmployee?.title ?? user?.jobTitle ?? '', department: linkedEmployee?.dept ?? user?.department ?? '',
    emergencyContactName: linkedEmployee?.emergencyContactName ?? user?.emergencyContactName ?? '', emergencyContactPhone: linkedEmployee?.emergencyContactPhone ?? user?.emergencyContactPhone ?? '',
  }))
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() => readSettingsRecord(`${userSettingsKey}:preferences`, {
    'Email notifications': true, 'Push alerts': true, 'Desktop sounds': false, 'Two-factor authentication': false,
  }))
  const [passwordValues, setPasswordValues] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() =>
    readSettingsRecord('hrm-demo-role-permissions', defaultRolePermissions),
  )
  const [audit, setAudit] = useState<AuditEntry[]>(() =>
    readSettingsRecord('hrm-demo-audit-log', sampleAudit),
  )
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>(() => readSettingsRecord('hrm-demo-settings', {
    'Payroll cycle (days)': '30', 'Pay date (day of month)': '1', 'Working days per month': '26', 'Overtime multiplier': '1.5',
    'PF contribution (%)': '12', 'ESI contribution (%)': '0', 'Professional tax (demo amount)': '25', 'TDS rate (%)': '10',
    'Default deductions (demo amount)': '0', 'Annual paid leave quota (days)': '18', 'Carry-forward limit (days)': '5',
    'Accrual per month (days)': '1.5', 'Manager approval required': 'true',
  }))
  const sections = [
    'General',
    'Profile',
    'Notifications',
    'Appearance',
    'Security',
    'Roles & Permissions',
    'Leave Policies',
    'Payroll Settings',
    'Holiday Calendar',
    'Audit Log',
  ].filter((section) => portal === 'admin' || ['General', 'Profile', 'Notifications', 'Appearance', 'Security'].includes(section))
  const persistPreferences = (next: Record<string, boolean>) => {
    setPreferences(next)
    localStorage.setItem(`${userSettingsKey}:preferences`, JSON.stringify(next))
    toast.success('Notification preferences saved')
  }
  const fields =
    tab === 'General'
      ? ['Company name', 'Company email', 'Phone number', 'Address', 'Timezone']
      : tab === 'Profile'
        ? ['Full name', 'Phone number', 'Job title', 'Department', 'Emergency contact name', 'Emergency contact phone']
        : tab === 'Notifications'
          ? [
              'Email notifications',
              'Push alerts',
              'Desktop sounds',
              'Two-factor authentication',
            ]
          : tab === 'Appearance'
            ? ['Compact mode', 'Sidebar behavior']
            : tab === 'Security'
              ? ['Current Password', 'New Password', 'Confirm Password']
              : tab === 'Payroll Settings'
                ? ['Payroll cycle (days)', 'Pay date (day of month)', 'Working days per month', 'Overtime multiplier', 'PF contribution (%)', 'ESI contribution (%)', 'Professional tax (demo amount)', 'TDS rate (%)', 'Default deductions (demo amount)']
                : tab === 'Leave Policies'
                  ? ['Annual paid leave quota (days)', 'Carry-forward limit (days)', 'Accrual per month (days)', 'Manager approval required']
                  : tab === 'Holiday Calendar'
                    ? ['Calendar year', 'Holiday name', 'Holiday date', 'Location']
                    : ['Admin role', 'HR role', 'Manager role', 'Employee role']

  const roles = ['Super Admin', 'HR Admin', 'HR Manager', 'Manager', 'Employee']
  const modules = ['Employees', 'Attendance', 'Leave', 'Shifts', 'Departments', 'Payroll', 'Reports', 'Settings']
  const actions = ['View', 'Edit', 'Approve', 'Manage']
  const profileKeyByField: Record<string, keyof typeof accountProfile> = {
    'Full name': 'name', 'Phone number': 'phone', 'Job title': 'jobTitle', Department: 'department',
    'Emergency contact name': 'emergencyContactName', 'Emergency contact phone': 'emergencyContactPhone',
  }
  const validatePassword = (values: typeof passwordValues, submitting = false) => {
    if ((!values.current && submitting) || (values.next && !values.current)) return 'Enter your current password.'
    if (values.next && values.next.length < 8) return 'Use at least 8 characters for the new password.'
    if (values.confirm && values.next !== values.confirm) return 'New passwords do not match.'
    if (values.current && values.next && values.current === values.next) return 'Choose a password different from your current one.'
    if (submitting && !values.next) return 'Enter a new password.'
    if (submitting && !values.confirm) return 'Confirm your new password.'
    return ''
  }
  const saveDemoPermissions = () => {
    localStorage.setItem('hrm-demo-role-permissions', JSON.stringify(permissions))
    const nextAudit = [
      {
        time: new Date().toLocaleString(),
        actor: 'HR Administrator (demo)',
        action: 'Updated demo role permissions',
        scope: 'Settings',
      },
      ...audit,
    ]
    localStorage.setItem('hrm-demo-audit-log', JSON.stringify(nextAudit))
    setAudit(nextAudit)
    toast.success('Demo permissions saved in this browser.')
  }
  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (tab === 'Profile') {
      const name = accountProfile.name.trim()
      if (!name || !accountProfile.phone.trim()) {
        toast.error('Enter your name and phone number.')
        return
      }
      const profile = { ...accountProfile, name, phone: accountProfile.phone.trim() }
      updateUser({ name, phone: profile.phone, jobTitle: profile.jobTitle, department: profile.department, emergencyContactName: profile.emergencyContactName, emergencyContactPhone: profile.emergencyContactPhone })
      if (linkedEmployee) {
        employeeStore.save(employeeStore.getSnapshot().map((employee) => employee.id === linkedEmployee.id ? {
          ...employee,
          firstName: name.split(/\s+/)[0] ?? name,
          lastName: name.split(/\s+/).slice(1).join(' '),
          phone: profile.phone,
          title: profile.jobTitle,
          dept: profile.department,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
        } : employee))
      }
      toast.success('Profile updated successfully')
      setSaved(true)
      return
    }
    if (tab === 'Security') {
      const validationMessage = validatePassword(passwordValues, true)
      if (validationMessage) {
        setPasswordError(validationMessage)
        return
      }
      setPasswordError('')
      setPasswordBusy(true)
      try {
        if (!user?.id) throw new Error('Your account could not be identified. Sign in again and retry.')
        await changeAccountPassword(user.id, passwordValues.current, passwordValues.next)
        setPasswordValues({ current: '', next: '', confirm: '' })
        toast.success('Password updated successfully!')
        setSaved(true)
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'Unable to update your password.')
      } finally {
        setPasswordBusy(false)
      }
      return
    }
    localStorage.setItem('hrm-demo-settings', JSON.stringify(settingsValues))
    setSaved(true)
    toast.success('Settings updated successfully')
  }

  return (
    <div className="settings-layout module-settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">
        {sections.map((section) => (
          <button
            type="button"
            className={tab === section ? 'selected' : ''}
            key={section}
            onClick={() => {
              setTab(section)
              setSaved(false)
            }}
          >
            {section}
            <ArrowUpRight size={14} />
          </button>
        ))}
      </nav>
      {tab === 'Roles & Permissions' ? (
        <section className="panel settings-form settings-rbac-panel">
          <div className="settings-section-heading">
            <div>
              <span className="eyebrow">ACCESS CONTROL</span>
              <h2>Role-permission matrix</h2>
              <p>Demo role settings for workspace access.</p>
            </div>
          </div>
          <div className="settings-rbac-scroll">
            <table className="hr-table settings-rbac-table">
              <thead>
                <tr>
                  <th>Role / module</th>
                  {actions.map((action) => (
                    <th key={action}>{action}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.flatMap((role) =>
                  modules.map((moduleName) => (
                    <tr key={`${role}-${moduleName}`}>
                      <th>
                        {role}
                        <small>{moduleName}</small>
                      </th>
                      {actions.map((actionName) => {
                        const key = `${role}:${moduleName}:${actionName}`
                        return (
                          <td key={key}>
                            <input
                              aria-label={`${role} ${moduleName} ${actionName}`}
                              type="checkbox"
                              checked={Boolean(permissions[key])}
                              onChange={(event) =>
                                setPermissions((current) => ({
                                  ...current,
                                  [key]: event.target.checked,
                                }))
                              }
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <p className="settings-demo-note">
            Permission settings persist in browser storage for this demo; route authorization
            remains based on the signed-in demo role.
          </p>
          <button type="button" className="button primary" onClick={saveDemoPermissions}>
            Save permissions
          </button>
        </section>
      ) : tab === 'Audit Log' ? (
        <section className="panel settings-form">
          <div className="settings-section-heading">
            <div>
              <span className="eyebrow">WORKSPACE ACTIVITY</span>
              <h2>Audit log</h2>
              <p>Sample and settings activity stored in this browser.</p>
            </div>
          </div>
          <div className="settings-audit-list">
            {audit.map((entry) => (
              <article key={`${entry.time}-${entry.action}`}>
                <time>{entry.time}</time>
                <div>
                  <strong>{entry.action}</strong>
                  <small>
                    {entry.actor} · {entry.scope}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <p className="settings-demo-note">
            This local demo feed is not a compliance audit trail.
          </p>
        </section>
      ) : (
        <form
          className="panel settings-form"
          onSubmit={(event) => void saveSettings(event)}
        >
          <div className="settings-section-heading">
            <div>
              <span className="eyebrow">WORKSPACE PREFERENCES</span>
              <h2>{tab} settings</h2>
              <p>Update your {tab.toLowerCase()} preferences for your HRM workspace.</p>
            </div>
          </div>
          <div className="settings-field-list">
            {fields.map((field, index) => (
              <label className="setting-field" key={field}>
                <span>{field}</span>
                {tab === 'Notifications' ? (
                  <input type="checkbox" checked={Boolean(preferences[field])} onChange={(event) => persistPreferences({ ...preferences, [field]: event.target.checked })} />
                ) : tab === 'Profile' ? (
                  <input
                    type="text"
                    value={accountProfile[profileKeyByField[field]]}
                    onChange={(event) => setAccountProfile((current) => ({ ...current, [profileKeyByField[field]]: event.target.value }))}
                  />
                ) : tab === 'Security' ? (
                  <input
                    type="password"
                    autoComplete={index === 0 ? 'current-password' : 'new-password'}
                    value={index === 0 ? passwordValues.current : index === 1 ? passwordValues.next : passwordValues.confirm}
                    onChange={(event) => {
                      const key = index === 0 ? 'current' : index === 1 ? 'next' : 'confirm'
                      const nextValues = { ...passwordValues, [key]: event.target.value }
                      setPasswordValues(nextValues)
                      setPasswordError(validatePassword(nextValues))
                    }}
                  />
                ) : tab === 'Leave Policies' && field === 'Manager approval required' ? (
                  <input type="checkbox" checked={settingsValues[field] === 'true'} onChange={(event) => setSettingsValues((current) => ({ ...current, [field]: String(event.target.checked) }))} />
                ) : tab === 'Appearance' && field === 'Compact mode' ? (
                  <input type="checkbox" aria-label={field} checked={settingsValues[field] === 'true'} onChange={(event) => setSettingsValues((current) => ({ ...current, [field]: String(event.target.checked) }))} />
                ) : tab === 'Appearance' && field === 'Sidebar behavior' ? (
                  <ToolbarSelect ariaLabel={field} className="toolbar-select--block" value={settingsValues[field] ?? 'Expanded'} onValueChange={(value) => setSettingsValues((current) => ({ ...current, [field]: value }))} options={['Expanded', 'Collapsed'].map((item) => ({ label: String(item), value: String(item) }))} />
                ) : tab === 'General' && index === 4 ? (
                  <ToolbarSelect ariaLabel={field} className="toolbar-select--block" value={settingsValues[field] ?? 'Asia/Kolkata'} onValueChange={(value) => setSettingsValues((current) => ({ ...current, [field]: value }))} options={['Asia/Kolkata', 'UTC', 'America/New_York'].map((item) => ({ label: item, value: item }))} />
                ) : (
                  <input
                    type={field.toLowerCase().includes('email') ? 'email' : /\b(days|date|rate|amount|quota|limit|accrual|multiplier|contribution|deductions|calendar year|day of month)\b/i.test(field) ? 'number' : 'text'}
                    placeholder={`Enter ${field.toLowerCase()}`}
                    value={settingsValues[field] ?? ''}
                    step="any"
                    onChange={(event) => setSettingsValues((current) => ({ ...current, [field]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
          {tab === 'Security' && passwordError && <p className="field-error" role="alert">{passwordError}</p>}
          <button className="button primary" type="submit">
            {tab === 'Security' ? passwordBusy ? 'Updating…' : 'Update password' : saved ? 'Saved' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  )
}
