import { apiClient } from '@/services/api-client'
import type { AttendanceCorrectionRecord } from './attendance.service'

type AttendanceCorrectionInput = Omit<AttendanceCorrectionRecord, 'id' | 'status' | 'decisionAt'>
const storageKey = 'hrm-attendance-corrections'

function readLocal(): AttendanceCorrectionRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(value) ? value.filter((row): row is AttendanceCorrectionRecord => Boolean(row && typeof row === 'object' && typeof row.id === 'string' && row.id)) : []
  } catch { return [] }
}

function writeLocal(rows: AttendanceCorrectionRecord[]) {
  const validRows = rows.filter((row): row is AttendanceCorrectionRecord => Boolean(row && typeof row.id === 'string' && row.id))
  localStorage.setItem(storageKey, JSON.stringify(validRows))
  window.dispatchEvent(new Event('hrm:data-change'))
  return validRows
}

export const attendanceCorrectionApi = {
  async list() {
    try {
      const response = await apiClient.get<AttendanceCorrectionRecord[]>('/attendance-corrections')
      if (!Array.isArray(response.data)) throw new Error('The attendance correction API returned invalid data.')
      const rows = response.data.filter((item): item is AttendanceCorrectionRecord => Boolean(item && typeof item.id === 'string' && item.id))
      writeLocal(rows)
      return rows
    } catch { return readLocal() }
  },
  async submit(input: AttendanceCorrectionInput) {
    let record: AttendanceCorrectionRecord
    try {
      const response = await apiClient.post<AttendanceCorrectionRecord, AttendanceCorrectionInput>('/attendance-corrections', input)
      if (!response.data || !response.data.id) throw new Error('The attendance correction API returned an invalid record.')
      record = { ...response.data, submittedAt: response.data.submittedAt ?? new Date().toISOString() }
    } catch { record = { ...input, id: `AC-${Date.now()}`, status: 'Pending', submittedAt: new Date().toISOString() } }
    writeLocal([record, ...readLocal().filter((item) => item.id !== record.id)])
    return record
  },
  async decide(id: string, status: 'Approved' | 'Rejected') {
    let record: AttendanceCorrectionRecord
    try {
      const response = await apiClient.patch<AttendanceCorrectionRecord, { status: 'Approved' | 'Rejected' }>(
        `/attendance-corrections/${encodeURIComponent(id)}/status`, { status },
      )
      record = response.data && response.data.id ? response.data : (() => { const existing = readLocal().find((item) => item.id === id); return existing ? { ...existing, status, decisionAt: new Date().toISOString() } : (() => { throw new Error('Attendance correction request was not found.') })() })()
    } catch {
      const existing = readLocal().find((item) => item.id === id)
      if (!existing) throw new Error('Attendance correction request was not found.')
      record = { ...existing, status, decisionAt: new Date().toISOString() }
    }
    writeLocal([record, ...readLocal().filter((item) => item.id !== record.id)])
    return record
  },
  async update(id: string, input: Pick<AttendanceCorrectionRecord, 'checkIn' | 'checkOut' | 'reason'>) {
    let record: AttendanceCorrectionRecord
    try {
      const response = await apiClient.patch<AttendanceCorrectionRecord, typeof input>(`/attendance-corrections/${encodeURIComponent(id)}`, input)
      record = response.data && response.data.id ? response.data : readLocal().find((item) => item.id === id) ?? (() => { throw new Error('Attendance correction request was not found.') })()
      record = { ...record, ...input }
    } catch {
      const existing = readLocal().find((item) => item.id === id)
      if (!existing) throw new Error('Attendance correction request was not found.')
      if (existing.status !== 'Pending') throw new Error('Only pending correction requests can be edited.')
      record = { ...existing, ...input }
    }
    writeLocal([record, ...readLocal().filter((item) => item?.id !== record.id)])
    return record
  },
}
