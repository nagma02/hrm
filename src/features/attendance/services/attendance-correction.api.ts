import { apiClient } from '@/services/api-client'
import type { AttendanceCorrectionRecord } from './attendance.service'

type AttendanceCorrectionInput = Omit<AttendanceCorrectionRecord, 'id' | 'status' | 'decisionAt'>
const storageKey = 'hrm-attendance-corrections'

function readLocal(): AttendanceCorrectionRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(value) ? value as AttendanceCorrectionRecord[] : []
  } catch { return [] }
}

function writeLocal(rows: AttendanceCorrectionRecord[]) {
  localStorage.setItem(storageKey, JSON.stringify(rows))
  window.dispatchEvent(new Event('hrm:data-change'))
  return rows
}

export const attendanceCorrectionApi = {
  async list() {
    try {
      const response = await apiClient.get<AttendanceCorrectionRecord[]>('/attendance-corrections')
      if (!Array.isArray(response.data)) throw new Error('The attendance correction API returned invalid data.')
      writeLocal(response.data)
      return response.data
    } catch { return readLocal() }
  },
  async submit(input: AttendanceCorrectionInput) {
    let record: AttendanceCorrectionRecord
    try {
      const response = await apiClient.post<AttendanceCorrectionRecord, AttendanceCorrectionInput>('/attendance-corrections', input)
      record = response.data
    } catch { record = { ...input, id: `AC-${Date.now()}`, status: 'Pending' } }
    writeLocal([record, ...readLocal().filter((item) => item.id !== record.id)])
    return record
  },
  async decide(id: string, status: 'Approved' | 'Rejected') {
    let record: AttendanceCorrectionRecord
    try {
      const response = await apiClient.patch<AttendanceCorrectionRecord, { status: 'Approved' | 'Rejected' }>(
        `/attendance-corrections/${encodeURIComponent(id)}/status`, { status },
      )
      record = response.data
    } catch {
      const existing = readLocal().find((item) => item.id === id)
      if (!existing) throw new Error('Attendance correction request was not found.')
      record = { ...existing, status, decisionAt: new Date().toISOString() }
    }
    writeLocal([record, ...readLocal().filter((item) => item.id !== record.id)])
    return record
  },
}
