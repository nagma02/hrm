import { Fragment, useMemo, useState } from 'react'
import { format, getDaysInMonth, getDay } from 'date-fns'
import { Search } from 'lucide-react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import AttendanceCalendar from '@/features/attendance/components/AttendanceCalendar'
import { PunchLocationCell } from '@/features/attendance/components/PunchProofCells'
import { attendanceDateKey, listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { navigateTo } from '@/app/router/navigation'

const months = Array.from({ length: 12 }, (_, index) => format(new Date(2026, index, 1), 'MMMM'))
const displayTime = (value?: string) => value ? format(new Date(value), 'hh:mm a') : '—'
function punchValue(row: ModuleRow, side: 'in' | 'out') {
  const timestamp = side === 'in' ? row.checkInAt : row.checkOutAt
  if (timestamp) return displayTime(timestamp)
  const value = row.detail.split('—').map((part) => part.trim())[side === 'in' ? 0 : 1]
  return value && /^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(value) ? value : '—'
}
function minutesFromTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)
  if (!match) return undefined
  let hours = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hours += 12
  return hours * 60 + Number(match[2])
}
const hoursBetween = (row: ModuleRow) => {
  const start = row.checkInAt ? new Date(row.checkInAt).getTime() / 60_000 : minutesFromTime(punchValue(row, 'in'))
  const end = row.checkOutAt ? new Date(row.checkOutAt).getTime() / 60_000 : minutesFromTime(punchValue(row, 'out'))
  return start !== undefined && end !== undefined ? Math.max(0, end - start - (row.breakMinutes ?? 0)) / 60 : 0
}

function statusCode(row?: ModuleRow, date?: Date) {
  if (!row) return date && [0, 6].includes(getDay(date)) ? 'WO' : 'A'
  if (row.status === 'On Leave') return 'HO'
  if (row.status === 'Half-day') return 'HD'
  if ((row.checkInAt && !row.checkOutAt) || (!row.checkInAt && row.checkOutAt)) return 'MP'
  if (row.status === 'Absent') return 'A'
  return 'P'
}

function downloadSheet(rows: { employee: string; department: string; cells: string[] }[], year: number, month: number) {
  const days = getDaysInMonth(new Date(year, month, 1))
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const body = rows.map((row) => `<tr><td>${escape(row.employee)}</td><td>${escape(row.department)}</td>${row.cells.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')
  const head = Array.from({ length: days }, (_, index) => `<th>${index + 1}</th>`).join('')
  const html = `<html><meta charset="utf-8"><table><thead><tr><th>Employee</th><th>Department</th>${head}</tr></thead><tbody>${body}</tbody></table></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `attendance-${format(new Date(year, month, 1), 'yyyy-MM')}.xls`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function MonthlyAttendanceCalendarPage() {
  useHRMDataChange()
  const rows = listAttendanceRows()
  return <PageContainer><PageHeader title="Monthly Calendar" subtitle="Review team attendance by day and month." /><AttendanceCalendar rows={rows} /></PageContainer>
}

export function AttendanceSheetPage() {
  const revision = useHRMDataChange()
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [includeInactive, setIncludeInactive] = useState(false)
  const [previewed, setPreviewed] = useState(true)
  const [compare, setCompare] = useState(false)
  const allEmployees = employeeStore.getSnapshot()
  const employees = allEmployees.filter((employee) => includeInactive || employee.status.toLowerCase() !== 'inactive')
  const days = getDaysInMonth(new Date(year, month, 1))
  const rows = listAttendanceRows()
  const monthRows = rows.filter((row) => attendanceDateKey(row).startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const sheet = employees.map((employee) => {
    const name = `${employee.firstName} ${employee.lastName}`
    const cells = Array.from({ length: days }, (_, index) => {
      const date = new Date(year, month, index + 1)
      const row = monthRows.find((item) => item.employeeId === employee.id && Number(attendanceDateKey(item).slice(-2)) === index + 1)
      return { date, row, code: statusCode(row, date) }
    })
    return { employee, name, cells }
  })
  const activeCount = allEmployees.filter((employee) => employee.status.toLowerCase() !== 'inactive').length
  const comparisonRows = useMemo(() => {
    const previousMonth = month === 0 ? 11 : month - 1
    const previousYear = month === 0 ? year - 1 : year
    return employees.map((employee) => {
      const count = (targetMonth: number, targetYear: number) => rows.filter((row) => row.employeeId === employee.id && attendanceDateKey(row).startsWith(`${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`) && ['Present', 'Late', 'Half-day'].includes(row.status)).length
      return { id: employee.id, name: `${employee.firstName} ${employee.lastName}`, previous: count(previousMonth, previousYear), current: count(month, year) }
    })
  }, [employees, month, rows, revision, year])

  return <PageContainer>
    <PageHeader title="Attendance Sheet" subtitle="Preview monthly attendance sheet and download Excel report." />
    <section className="panel attendance-sheet-controls">
      <label>Month<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{months.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label>
      <label>Year<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 3 + index).map((value) => <option key={value}>{value}</option>)}</select></label>
      <button className="button primary" onClick={() => setPreviewed(true)}>Preview Sheet</button>
      <button className="button attendance-download" onClick={() => downloadSheet(sheet.map(({ name, employee, cells }) => ({ employee: name, department: employee.dept, cells: cells.map(({ code, row }) => `${code}${row ? ` ${punchValue(row, 'in')} / ${punchValue(row, 'out')}` : ''}`) })), year, month)}>Download Excel</button>
      <button className="button attendance-compare" aria-pressed={compare} onClick={() => setCompare((value) => !value)}>{compare ? '✓' : '☐'} Compare Attendance Sheet</button>
      <label className="attendance-include-inactive"><input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} /> Include deactivated employees</label>
    </section>
    <div className="attendance-sheet-summary"><article><span>Total employees</span><strong>{employees.length}</strong></article><article><span>Active employees</span><strong>{activeCount}</strong></article><article><span>Deactivated employees included</span><strong>{includeInactive ? allEmployees.filter((employee) => employee.status.toLowerCase() === 'inactive').length : 0}</strong></article></div>
    <section className="panel attendance-sheet-panel">
      <div className="attendance-legend">{[['P', 'Present'], ['A', 'Absent'], ['HD', 'Half day'], ['WO', 'Week off'], ['HO', 'Holiday / leave'], ['MP', 'Missing punch']].map(([code, label]) => <span key={code} className={`attendance-code attendance-code-${code.toLowerCase()}`}><b>{code}</b> {label}</span>)}<span>Leave Codes</span></div>
      {!previewed ? <div className="empty-state">Choose a month and preview the attendance sheet.</div> : <div className="attendance-sheet-scroll"><table className="attendance-month-grid"><thead><tr><th rowSpan={2}>Employee Name</th>{Array.from({ length: days }, (_, index) => <th key={index} colSpan={4} className="attendance-day-heading">{format(new Date(year, month, index + 1), 'EEEE')}</th>)}</tr><tr>{Array.from({ length: days }, (_, index) => <th key={index} colSpan={4}>{index + 1}<div className="attendance-day-subhead"><span>Status</span><span>Punch In</span><span>Punch Out</span><span>HD Count</span></div></th>)}</tr></thead><tbody>{sheet.map(({ employee, name, cells }) => <tr key={employee.id}><th>{name}</th>{cells.map(({ date, row, code }) => <Fragment key={date.toISOString()}><td className={`attendance-cell attendance-code-${code.toLowerCase()}`}><b>{code}</b></td><td>{row ? punchValue(row, 'in') : '—'}</td><td>{row ? punchValue(row, 'out') : '—'}</td><td>{code === 'HD' ? '0.5' : '—'}</td></Fragment>)}</tr>)}</tbody></table></div>}
    </section>
    {compare && <section className="panel data-panel"><div className="panel-head"><div><h2>Attendance comparison</h2><span>Present days by employee: previous month and selected month</span></div></div><div className="table-scroll"><table className="hr-table"><thead><tr><th>Employee</th><th>Previous month</th><th>{format(new Date(year, month, 1), 'MMMM yyyy')}</th></tr></thead><tbody>{comparisonRows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.previous}</td><td>{row.current}</td></tr>)}</tbody></table></div></section>}
  </PageContainer>
}

export function UserMonthlyAttendanceReportPage() {
  const revision = useHRMDataChange()
  const [query, setQuery] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [month, setMonth] = useState('')
  const [applied, setApplied] = useState(false)
  const employees = employeeStore.getSnapshot()
  const rows = useMemo(() => {
    if (!applied || !month || !year) return []
    const needle = query.trim().toLowerCase()
    const matching = employees.filter((employee) => !needle || `${employee.firstName} ${employee.lastName} ${employee.id} ${employee.email}`.toLowerCase().includes(needle))
    return listAttendanceRows().filter((row) => matching.some((employee) => employee.id === row.employeeId) && attendanceDateKey(row).startsWith(`${year}-${month}`)).sort((a, b) => attendanceDateKey(a).localeCompare(attendanceDateKey(b)))
  }, [applied, employees, month, query, revision, year])
  return <PageContainer>
    <PageHeader title="Monthly Attendance Report" subtitle="Search an employee and review their attendance, overtime, and punch locations." />
    <section className="panel attendance-monthly-report">
      <form className="attendance-report-filters" onSubmit={(event) => { event.preventDefault(); setApplied(true) }}>
        <label className="attendance-report-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name / Employee ID / Email" /></label>
        <label>Year<select value={year} onChange={(event) => setYear(event.target.value)}>{Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 3 + index).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Month<select value={month} onChange={(event) => setMonth(event.target.value)}><option value="">Select Month</option>{months.map((name, index) => <option key={name} value={String(index + 1).padStart(2, '0')}>{name}</option>)}</select></label>
        <button className="button primary" type="submit">Search</button>
      </form>
      <div className="table-scroll"><table className="hr-table"><thead><tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Total Hours</th><th>OT</th><th>Status</th><th>Punch In Location</th><th>Edit</th></tr></thead><tbody>{rows.map((row) => {
        const dateKey = attendanceDateKey(row)
        const ot = Math.max(0, hoursBetween(row) - 8)
        return <tr key={row.id}><td>{dateKey}</td><td>{punchValue(row, 'in')}</td><td>{punchValue(row, 'out')}</td><td>{hoursBetween(row) ? `${hoursBetween(row).toFixed(1)} hrs` : '—'}</td><td>{ot ? `${ot.toFixed(1)} hrs` : '—'}</td><td>{row.status}</td><td><PunchLocationCell location={row.punchLocation} /></td><td><button className="attendance-view-link" onClick={() => navigateTo(`/app/attendance/corrections?record=${encodeURIComponent(row.id)}`)}>Edit</button></td></tr>
      })}</tbody></table>{!rows.length && <div className="empty-state">{applied ? 'No attendance records found for this employee and month.' : 'Please search employee using Name, Employee ID or Email with Month & Year.'}</div>}</div>
    </section>
  </PageContainer>
}
