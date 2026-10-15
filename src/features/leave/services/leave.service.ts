import { format, parseISO } from 'date-fns'
import type { LeaveApplication, LeaveApplicationInput, LeaveStatus, LeaveType } from '../types/leave.types'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { notificationService } from '@/features/notifications/services/notification.service'
import { apiClient } from '@/services/api-client'

const storageKey = 'hrm-leave'

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

const seed: LeaveApplication[] = [
  { id: 'LV-1024', employeeId: 'E-1001', employeeName: 'Jane Cooper', employeeEmail: 'jane.cooper@example.com', leaveType: 'Annual Leave', startDate: '2026-10-10', endDate: '2026-10-14', numberOfDays: 5, reason: 'Family trip', status: 'Pending', appliedDate: '2026-10-01' },
  { id: 'LV-1023', employeeId: 'E-1003', employeeName: 'Aisha Khan', employeeEmail: 'aisha.khan@example.com', leaveType: 'Sick Leave', startDate: '2026-10-07', endDate: '2026-10-08', numberOfDays: 2, reason: 'Medical appointment', status: 'Approved', appliedDate: '2026-10-01' },
  { id: 'LV-1022', employeeId: 'E-1006', employeeName: 'Carlos Reyes', employeeEmail: 'carlos.reyes@example.com', leaveType: 'Casual Leave', startDate: '2026-10-03', endDate: '2026-10-03', numberOfDays: 1, reason: 'Personal', status: 'Rejected', appliedDate: '2026-10-01' },
]

function isLeaveType(value: string): value is LeaveType {
  return ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Annual Leave', 'Emergency Leave', 'Unpaid Leave', 'Maternity / Paternity Leave'].includes(value)
}

function normalizeStatus(value: unknown): LeaveStatus {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  if (normalized === 'approved') return 'Approved'
  if (normalized === 'rejected') return 'Rejected'
  if (normalized === 'cancelled') return 'Cancelled'
  return 'Pending'
}

function fromLegacy(value: unknown): LeaveApplication[] | null {
  if (!Array.isArray(value)) return null
  return value.flatMap((entry): LeaveApplication[] => {
    if (!entry || typeof entry !== 'object') return []
    const row = entry as Record<string, unknown>
    const rawLeaveType = String(row.leaveType ?? '')
    if (typeof row.employeeName === 'string' && typeof row.startDate === 'string' && typeof row.endDate === 'string' && isLeaveType(rawLeaveType)) {
      return [{
        id: String(row.id ?? `LV-${Date.now()}`), employeeId: String(row.employeeId ?? row.employeeEmail ?? row.id ?? ''),
        employeeName: row.employeeName, employeeEmail: String(row.employeeEmail ?? ''), leaveType: rawLeaveType,
        startDate: row.startDate, endDate: row.endDate, numberOfDays: Number(row.numberOfDays) || 1,
        reason: String(row.reason ?? ''), status: normalizeStatus(row.status), appliedDate: String(row.appliedDate ?? today()),
        ...(typeof row.employeePhone === 'string' ? { employeePhone: row.employeePhone } : {}),
        ...(row.balanceApplied === true ? { balanceApplied: true } : {}),
        ...(typeof row.legacyPeriod === 'string' ? { legacyPeriod: row.legacyPeriod } : {}),
        ...(typeof row.decisionBy === 'string' ? { decisionBy: row.decisionBy } : {}),
        ...(typeof row.decisionAt === 'string' ? { decisionAt: row.decisionAt } : {}),
        ...(typeof row.decisionComment === 'string' ? { decisionComment: row.decisionComment } : {}),
        ...(typeof row.rejectionReason === 'string' ? { rejectionReason: row.rejectionReason } : {}),
        ...(typeof row.attachmentName === 'string' ? { attachmentName: row.attachmentName } : {}),
      }]
    }

    // Preserve records created by the former generic Leave page.
    if (typeof row.name !== 'string') return []
    const detail = String(row.detail ?? '')
    const [rawType, ...reason] = detail.split('·')
    const typeLabel = rawType.trim()
    const leaveType: LeaveType = isLeaveType(typeLabel) ? typeLabel : 'Casual Leave'
    const date = today()
    return [{
      id: String(row.id ?? `LV-${Date.now()}`), employeeId: String(row.id ?? row.name), employeeName: row.name,
      employeeEmail: '', leaveType, startDate: date, endDate: date, numberOfDays: 1,
      reason: reason.join('·').trim() || detail || 'Existing leave request', status: normalizeStatus(row.status),
      appliedDate: date, ...(typeof row.date === 'string' ? { legacyPeriod: row.date } : {}),
    }]
  })
}

function readRaw(): LeaveApplication[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length === 0) return seed
    return fromLegacy(parsed) ?? seed
  } catch {
    return seed
  }
}

function read(): LeaveApplication[] {
  const employees = employeeStore.getSnapshot()
  return readRaw().flatMap((record) => {
    const employee = employees.find((item) => item.id === record.employeeId)
      ?? employees.find((item) => item.email.toLowerCase() === record.employeeEmail.toLowerCase())
      ?? employees.find((item) => `${item.firstName} ${item.lastName}`.toLowerCase() === record.employeeName.toLowerCase())
    return employee ? [{ ...record, employeeId: employee.id, employeeName: `${employee.firstName} ${employee.lastName}`, employeeEmail: employee.email }] : [record]
  })
}

let cachedRecords: LeaveApplication[] | null = null
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => { if (event.key === storageKey) cachedRecords = null })

function write(records: LeaveApplication[]) {
  cachedRecords = records
  localStorage.setItem(storageKey, JSON.stringify(records))
  window.dispatchEvent(new Event('hrm:data-change'))
}

function normalizeApplication(value: unknown): LeaveApplication {
  if (!value || typeof value !== 'object') throw new Error('The leave API returned an invalid record.')
  const row = value as Record<string, unknown>
  const leaveType = String(row.leaveType ?? '')
  if (!isLeaveType(leaveType)) throw new Error('The leave API returned an unsupported leave type.')
  return {
    id: String(row.id ?? ''),
    employeeId: String(row.employeeId ?? ''),
    employeeName: String(row.employeeName ?? 'Employee'),
    employeeEmail: String(row.employeeEmail ?? ''),
    ...(typeof row.employeePhone === 'string' ? { employeePhone: row.employeePhone } : {}),
    leaveType,
    startDate: String(row.startDate ?? ''),
    endDate: String(row.endDate ?? ''),
    numberOfDays: Number(row.numberOfDays) || 1,
    reason: String(row.reason ?? ''),
    status: normalizeStatus(row.status),
    appliedDate: String(row.appliedDate ?? today()),
    ...(row.balanceApplied === true ? { balanceApplied: true } : {}),
    ...(typeof row.decisionBy === 'string' ? { decisionBy: row.decisionBy } : {}),
    ...(typeof row.decisionAt === 'string' ? { decisionAt: row.decisionAt } : {}),
    ...(typeof row.decisionComment === 'string' ? { decisionComment: row.decisionComment } : {}),
    ...(typeof row.rejectionReason === 'string' ? { rejectionReason: row.rejectionReason } : {}),
    ...(typeof row.attachmentName === 'string' ? { attachmentName: row.attachmentName } : {}),
  }
}

export const leaveService = {
  list: () => cachedRecords ?? read(),
  async refresh() {
    try {
      const response = await apiClient.get<unknown>('/leave-requests')
      if (!Array.isArray(response.data)) throw new Error('The leave API returned an invalid request list.')
      const next = response.data.map(normalizeApplication)
      write(next)
      return next
    } catch {
      return read()
    }
  },
  getById(id: string) {
    return this.list().find((record) => record.id === id)
  },
  async applyLeave(data: LeaveApplicationInput) {
    let record: LeaveApplication
    try {
      const response = await apiClient.post<unknown, LeaveApplicationInput>('/leave-requests', data)
      record = normalizeApplication(response.data)
    } catch {
      record = normalizeApplication({ ...data, id: `LV-${Date.now()}`, status: 'Pending', appliedDate: today() })
    }
    write([record, ...this.list().filter((item) => item.id !== record.id)])
    await notificationService.notifyLeaveRequestSubmitted({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      leaveType: record.leaveType,
      startDate: record.startDate,
      endDate: record.endDate,
    })
    return record
  },
  async updateStatus(id: string, status: Exclude<LeaveStatus, 'Pending'>, decision?: { decisionBy?: string; decisionComment?: string }) {
    let record: LeaveApplication
    try {
      const response = await apiClient.patch<unknown, { status: string; decisionComment?: string }>(`/leave-requests/${encodeURIComponent(id)}/status`, {
        status: status.toUpperCase(),
        ...(decision?.decisionComment ? { decisionComment: decision.decisionComment } : {}),
      })
      record = normalizeApplication(response.data)
    } catch {
      const current = this.list().find((item) => item.id === id)
      if (!current) throw new Error('Leave request was not found.')
      record = { ...current, status, ...(decision?.decisionBy ? { decisionBy: decision.decisionBy } : {}), ...(decision?.decisionComment ? { decisionComment: decision.decisionComment } : {}), decisionAt: new Date().toISOString(), ...(status === 'Approved' ? { balanceApplied: true } : {}) }
    }
    write([record, ...this.list().filter((item) => item.id !== record.id)])
    if (status === 'Approved' || status === 'Rejected') {
      await notificationService.notifyLeaveStatus({
        id: record.id,
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        leaveType: record.leaveType,
        startDate: record.startDate,
        endDate: record.endDate,
      }, status)
    }
    return record
  },
  async cancel(id: string) {
    let record: LeaveApplication
    try {
      const response = await apiClient.patch<unknown, { status: string }>(`/leave-requests/${encodeURIComponent(id)}/status`, { status: 'CANCELLED' })
      record = normalizeApplication(response.data)
    } catch {
      const current = this.list().find((item) => item.id === id)
      if (!current) throw new Error('Leave request was not found.')
      if (current.status !== 'Pending') throw new Error('Only pending leave requests can be cancelled.')
      record = { ...current, status: 'Cancelled', decisionAt: new Date().toISOString() }
    }
    write([record, ...this.list().filter((item) => item.id !== record.id)])
    return record
  },
}

export function formatLeaveDate(value: string) {
  try { return format(parseISO(value), 'dd MMM yyyy') } catch { return value }
}
