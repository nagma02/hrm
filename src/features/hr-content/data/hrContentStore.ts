export type HRHoliday = { id: string; name: string; date: string; type: string; description: string }
export type HRAnnouncement = { id: string; title: string; description: string; category: string; priority: 'Low' | 'Normal' | 'High'; publishDate: string; expiryDate: string; audience: string; status: 'Draft' | 'Published'; requiresAcknowledgement?: boolean; attachments?: Array<{ name: string; url: string }> }
export type HRContentSnapshot = { holidays: HRHoliday[]; announcements: HRAnnouncement[] }

const storageKey = 'hrm-content'
const holidaySeed: HRHoliday[] = [
  { id: 'HOL-2026-01', name: 'Diwali Holiday', date: '2026-10-18', type: 'Company holiday', description: 'Organization-wide holiday. Regional observance may vary.' },
  { id: 'HOL-2026-02', name: 'Winter Break', date: '2026-12-25', type: 'Company holiday', description: 'Annual company winter break.' },
]
const announcementSeed: HRAnnouncement[] = [
  { id: 'ANN-2026-01', title: 'Quarterly town hall and planning update', description: 'Our Q4 company town hall will take place on 18 October at 2:00 PM. Leadership will review business priorities, team goals, and upcoming initiatives for the quarter ahead. Please join with your managers and come prepared with any questions or operational suggestions.', category: 'Notice', priority: 'High', publishDate: '2026-10-08', expiryDate: '2026-10-31', audience: 'All employees', status: 'Published' },
  { id: 'ANN-2026-02', title: 'Work-from-home and hybrid policy update', description: 'The revised hybrid work policy is now available on the HR portal. Please review the updated eligibility guidance, core office days, and approval process before submitting any future work arrangement requests.', category: 'Policy', priority: 'Normal', publishDate: '2026-10-06', expiryDate: '2026-12-31', audience: 'All employees', status: 'Published' },
  { id: 'ANN-2026-03', title: 'November payroll processing schedule', description: 'Payroll for November will be processed on 28 November, with salary credits reflected in employee accounts by the end of the business day. Managers must confirm final approvals by 24 November.', category: 'HR Announcement', priority: 'Normal', publishDate: '2026-10-05', expiryDate: '2026-11-30', audience: 'All employees', status: 'Published' },
  { id: 'ANN-2026-04', title: 'Festival celebration and team event', description: 'We are organizing a company celebration to mark the festive season on 24 October. More details on venue, timings, and RSVP instructions will be shared with department leads shortly.', category: 'Event', priority: 'Low', publishDate: '2026-10-04', expiryDate: '2026-10-30', audience: 'All employees', status: 'Published' },
]
function read(): HRContentSnapshot {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Partial<HRContentSnapshot> | null
    return { holidays: Array.isArray(saved?.holidays) ? saved.holidays : holidaySeed, announcements: Array.isArray(saved?.announcements) ? saved.announcements : announcementSeed }
  } catch { return { holidays: holidaySeed, announcements: announcementSeed } }
}
let snapshot = read()
const listeners = new Set<() => void>()
function notify() { snapshot = read(); listeners.forEach((listener) => listener()) }
function onStorage(event: StorageEvent) { if (event.key === storageKey) notify() }
function save(next: HRContentSnapshot) { localStorage.setItem(storageKey, JSON.stringify(next)); snapshot = next; listeners.forEach((listener) => listener()); window.dispatchEvent(new Event('hrm:data-change')) }
export const hrContentStore = {
  getSnapshot: () => snapshot,
  reload() { notify() },
  subscribe(listener: () => void) { if (!listeners.size) window.addEventListener('storage', onStorage); listeners.add(listener); return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener('storage', onStorage) } },
  saveHoliday(holiday: HRHoliday) { const current = this.getSnapshot(); save({ ...current, holidays: [holiday, ...current.holidays.filter((item) => item.id !== holiday.id)] }) },
  deleteHoliday(id: string) { const current = this.getSnapshot(); save({ ...current, holidays: current.holidays.filter((item) => item.id !== id) }) },
  saveAnnouncement(announcement: HRAnnouncement) { const current = this.getSnapshot(); save({ ...current, announcements: [announcement, ...current.announcements.filter((item) => item.id !== announcement.id)] }) },
  deleteAnnouncement(id: string) { const current = this.getSnapshot(); save({ ...current, announcements: current.announcements.filter((item) => item.id !== id) }) },
}
