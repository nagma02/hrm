export type AnnouncementEngagement = {
  announcementId: string
  employeeId: string
  readAt?: string
  acknowledgedAt?: string
}

const storageKey = 'hrm-announcement-engagement'

function readAll(): AnnouncementEngagement[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(value) ? value.filter((row): row is AnnouncementEngagement =>
      Boolean(row && typeof row.announcementId === 'string' && typeof row.employeeId === 'string'),
    ) : []
  } catch {
    return []
  }
}

function write(rows: AnnouncementEngagement[]) {
  localStorage.setItem(storageKey, JSON.stringify(rows))
  window.dispatchEvent(new Event('hrm:data-change'))
}

export const announcementEngagement = {
  list() {
    return readAll()
  },
  forEmployee(employeeId: string) {
    return readAll().filter((row) => row.employeeId === employeeId)
  },
  markRead(announcementId: string, employeeId: string) {
    const rows = readAll()
    const existing = rows.find((row) => row.announcementId === announcementId && row.employeeId === employeeId)
    const now = new Date().toISOString()
    write(existing
      ? rows.map((row) => row === existing ? { ...row, readAt: row.readAt ?? now } : row)
      : [...rows, { announcementId, employeeId, readAt: now }])
  },
  acknowledge(announcementId: string, employeeId: string) {
    const rows = readAll()
    const existing = rows.find((row) => row.announcementId === announcementId && row.employeeId === employeeId)
    const now = new Date().toISOString()
    write(existing
      ? rows.map((row) => row === existing ? { ...row, readAt: row.readAt ?? now, acknowledgedAt: row.acknowledgedAt ?? now } : row)
      : [...rows, { announcementId, employeeId, readAt: now, acknowledgedAt: now }])
  },
}
