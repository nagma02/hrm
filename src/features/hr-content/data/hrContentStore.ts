export type HRHoliday = { id: string; name: string; date: string; endDate?: string; duration?: 'full_day' | 'first_half' | 'second_half'; type: string; description: string }
export type HRAnnouncement = { id: string; title: string; description: string; category: string; priority: 'Low' | 'Normal' | 'High'; publishDate: string; expiryDate: string; audience: string; status: 'Draft' | 'Published'; requiresAcknowledgement?: boolean; attachments?: Array<{ name: string; url: string }> }
export type HRContentSnapshot = { holidays: HRHoliday[]; announcements: HRAnnouncement[] }

const storageKey = 'hrm-content'
const holidaySeed: HRHoliday[] = [
  { id: 'HOL-2026-01', name: 'Happy New Year', date: '2026-01-01', type: 'Company holiday', description: 'New Year' },
  { id: 'HOL-2026-02', name: 'Makar Sankranti', date: '2026-01-14', type: 'Regional holiday', description: 'Sankranti Festival' },
  { id: 'HOL-2026-03', name: 'Republic day', date: '2026-01-26', duration: 'second_half', type: 'Regional holiday', description: '77th Anniversary becoming a Republic.' },
  { id: 'HOL-2026-04', name: 'MahaShiv Ratri', date: '2026-02-15', type: 'Optional holiday', description: 'Shiv Ratri' },
  { id: 'HOL-2026-05', name: 'Holi', date: '2026-03-03', endDate: '2026-03-04', type: 'Regional holiday', description: 'Festival of Colours' },
  { id: 'HOL-2026-06', name: 'Rakshabandhan', date: '2026-08-28', type: 'Regional holiday', description: 'Sibling Festival' },
  { id: 'HOL-2026-07', name: 'Dussehra', date: '2026-10-20', type: 'Regional holiday', description: 'Vijayadashmi' },
  { id: 'HOL-2026-08', name: 'Diwali', date: '2026-11-06', endDate: '2026-11-11', type: 'Regional holiday', description: 'Festival of Lights' },
  { id: 'HOL-2026-09', name: 'Mussoorie Trip', date: '2026-08-05', endDate: '2026-08-06', type: 'Company holiday', description: 'Office Trip to Mussoorie' },
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
    const oldHolidayDemo = Array.isArray(saved?.holidays) && saved.holidays.length === 2
      && saved.holidays.some((holiday) => holiday.id === 'HOL-2026-01' && holiday.name === 'Diwali Holiday')
      && saved.holidays.some((holiday) => holiday.id === 'HOL-2026-02' && holiday.name === 'Winter Break')
    return { holidays: oldHolidayDemo ? holidaySeed : Array.isArray(saved?.holidays) ? saved.holidays : holidaySeed, announcements: Array.isArray(saved?.announcements) ? saved.announcements : announcementSeed }
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
