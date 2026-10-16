import { employeeStore } from '@/features/employees/data/employeeStore'
import { moduleSeeds, type ModuleRow } from '@/features/shared/data/moduleData'
import { format } from 'date-fns'
import type { Employee } from '@/features/employees/data/employeesData'
import { notificationService } from '@/features/notifications/services/notification.service'

const storageKey = 'hrm-attendance'
const correctionStorageKey = 'hrm-attendance-corrections'

export type AttendanceCorrectionRecord = {
  id: string
  employee: string
  date: string
  checkIn: string
  checkOut: string
  reason: string
  existingCheckIn?: string
  existingCheckOut?: string
  attendanceRecordId?: string
  employeeId?: string
  dateKey?: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedAt?: string
  decisionAt?: string
  decisionComment?: string
}

export function listAttendanceCorrections(): AttendanceCorrectionRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(correctionStorageKey) || '[]')
    return Array.isArray(value) ? value as AttendanceCorrectionRecord[] : []
  } catch { return [] }
}

export function saveAttendanceCorrections(rows: AttendanceCorrectionRecord[]) {
  localStorage.setItem(correctionStorageKey, JSON.stringify(rows))
  window.dispatchEvent(new Event('hrm:data-change'))
  return rows
}

function readRawRows(): ModuleRow[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null')
    return Array.isArray(value) ? value as ModuleRow[] : moduleSeeds.attendance
  } catch {
    return moduleSeeds.attendance
  }
}

function saveRows(rows: ModuleRow[]) {
  localStorage.setItem(storageKey, JSON.stringify(rows))
  window.dispatchEvent(new Event('hrm:data-change'))
}

function dateLabel(timestamp: number) { return format(new Date(timestamp), 'MMM dd, yyyy') }
function dateKey(timestamp: number) { return format(new Date(timestamp), 'yyyy-MM-dd') }
function timeLabel(timestamp: number) { return format(new Date(timestamp), 'hh:mm a') }
function isLate(timestamp: number) {
  const [hours, minutes] = format(new Date(timestamp), 'HH:mm').split(':').map(Number)
  return hours * 60 + minutes > 9 * 60 + 15
}

export function attendanceDateKey(row: Pick<ModuleRow, 'date' | 'dateKey'>) {
  if (row.dateKey) return row.dateKey
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return row.date
  const parsed = new Date(row.date)
  return Number.isNaN(parsed.getTime()) ? '' : format(parsed, 'yyyy-MM-dd')
}

export function listAttendanceRows(): ModuleRow[] {
  const rows = readRawRows()
  const employees = employeeStore.getSnapshot()
  return rows.flatMap((row) => {
    const employee = employees.find((item) => item.id === row.employeeId) ?? employees.find((item) =>
      `${item.firstName} ${item.lastName}`.toLocaleLowerCase() === row.name.toLocaleLowerCase(),
    )
    return employee
      ? [{ ...row, employeeId: employee.id, name: `${employee.firstName} ${employee.lastName}`, department: employee.dept, dateKey: attendanceDateKey(row) || undefined }]
      : []
  })
}

export function updateAttendanceRow(row: ModuleRow) {
  const rows = readRawRows()
  const existing = rows.find((item) => item.id === row.id)
    ?? rows.find((item) => item.employeeId === row.employeeId && attendanceDateKey(item) === attendanceDateKey(row))
  const next = existing ? rows.map((item) => item.id === existing.id ? { ...existing, ...row, id: existing.id } : item) : [row, ...rows]
  saveRows(next)
  return row
}

export function recordEmployeeClockIn(
  employee: Employee,
  timestamp: number,
  proof?: { location?: { latitude: number; longitude: number }; photo?: string },
) {
  const rows = readRawRows()
  const date = dateLabel(timestamp)
  const name = `${employee.firstName} ${employee.lastName}`
  const key = dateKey(timestamp)
  const matchesEmployee = (row: ModuleRow) => (row.employeeId === employee.id || (!row.employeeId && row.name.toLocaleLowerCase() === name.toLocaleLowerCase())) && (row.dateKey === key || row.date === date)
  const existing = rows.find((row) => matchesEmployee(row) && row.checkInAt && !row.checkOutAt)
  if (existing) return existing
  const record: ModuleRow = {
    id: `AT-${employee.id}-${format(new Date(timestamp), 'yyyyMMdd-HHmmss')}`,
    name,
    department: employee.dept,
    detail: `${timeLabel(timestamp)} — In progress`,
    date,
    status: isLate(timestamp) ? 'Late' : 'Present',
    employeeId: employee.id,
    dateKey: key,
    checkInAt: new Date(timestamp).toISOString(),
    ...(proof?.location ? { punchLocation: proof.location } : {}),
    ...(proof?.photo ? { punchPhoto: proof.photo } : {}),
  }
  saveRows([record, ...rows])
  void notificationService.notifyAttendancePunch(record, 'IN').catch(() => undefined)
  return record
}

export function recordEmployeeClockOut(employee: Employee, startedAt: number, endedAt: number) {
  const rows = readRawRows()
  const date = dateLabel(startedAt)
  const name = `${employee.firstName} ${employee.lastName}`
  const key = dateKey(startedAt)
  const existing = rows.find((row) => (row.employeeId === employee.id || (!row.employeeId && row.name.toLocaleLowerCase() === name.toLocaleLowerCase())) && (row.dateKey === key || row.date === date) && row.checkInAt === new Date(startedAt).toISOString() && !row.checkOutAt)
  if (!existing) return undefined
  const record: ModuleRow = {
    id: existing.id,
    name,
    department: employee.dept,
    detail: `${timeLabel(startedAt)} — ${timeLabel(endedAt)}`,
    date,
    status: isLate(startedAt) ? 'Late' : 'Present',
    employeeId: employee.id,
    dateKey: key,
    checkInAt: new Date(startedAt).toISOString(),
    checkOutAt: new Date(endedAt).toISOString(),
    ...(existing?.punchLocation ? { punchLocation: existing.punchLocation } : {}),
    ...(existing?.punchPhoto ? { punchPhoto: existing.punchPhoto } : {}),
  }
  saveRows(rows.map((row) => row.id === existing.id ? record : row))
  void notificationService.notifyAttendancePunch(record, 'OUT').catch(() => undefined)
  return record
}
