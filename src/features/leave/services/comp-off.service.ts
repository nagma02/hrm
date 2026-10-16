import { notificationService } from '@/features/notifications/services/notification.service'

export type CompOffStatus = 'Pending' | 'Approved' | 'Rejected'
export type CompOffRequest = {
  id: string
  employeeName: string
  employeeId: string
  date: string
  type: string
  value: 'Full Day' | 'Half Day'
  status: CompOffStatus
  reason: string
  submittedAt: string
  decisionAt?: string
}

const storageKey = 'hrm-comp-off-requests'
const seed: CompOffRequest[] = [
  ['Rohit Shukla', 'ADR-113', 'Full Day'], ['Shayaan Ghaffar', 'AR-017', 'Half Day'], ['Prashant Mani Tiwari', 'ADR-005', 'Full Day'],
  ['Shiva Mathur', 'ADR-038', 'Full Day'], ['Aditya Pandey', 'ADR-121', 'Full Day'], ['Amar Kumar Harijan', 'ADR-120', 'Full Day'],
  ['Shikha Maurya', 'AR-016', 'Full Day'], ['Rashmi Sahu', 'ADR-116', 'Full Day'], ['Priyanka Singh', 'MI-009', 'Full Day'], ['Ishwar Chandra', 'ADR-007', 'Full Day'],
].map(([employeeName, employeeId, value], index) => ({
  id: `CO-${20261013 + index}`,
  employeeName,
  employeeId,
  date: '2026-10-13',
  type: 'Week Off',
  value: value as CompOffRequest['value'],
  status: 'Pending' as const,
  reason: 'Compensatory off requested for working on a scheduled week off.',
  submittedAt: '2026-10-13T09:00:00.000Z',
}))

function read(): CompOffRequest[] {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === null) {
      localStorage.setItem(storageKey, JSON.stringify(seed))
      return seed
    }
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as CompOffRequest[] : []
  } catch {
    return []
  }
}

function write(requests: CompOffRequest[]) {
  localStorage.setItem(storageKey, JSON.stringify(requests))
  window.dispatchEvent(new Event('hrm:data-change'))
}

export const compOffService = {
  list: read,
  updateStatus(id: string, status: Exclude<CompOffStatus, 'Pending'>) {
    const requests = read()
    const request = requests.find((item) => item.id === id)
    if (!request) throw new Error('Comp off request was not found.')
    const updated = { ...request, status, decisionAt: new Date().toISOString() }
    write(requests.map((item) => item.id === id ? updated : item))
    if (request.status !== status) void notificationService.notifyCompOffStatus(request, status).catch(() => undefined)
    return updated
  },
}

