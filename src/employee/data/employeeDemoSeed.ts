import { employees } from '@/features/employees/data/employeesData'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import { payrollSeed } from '@/features/payroll/data/payrollData'
import type { PayrollRecord } from '@/features/payroll/types/payroll.types'
import type { HRAnnouncement, HRHoliday, HRContentSnapshot } from '@/features/hr-content/data/hrContentStore'
import { hrContentStore } from '@/features/hr-content/data/hrContentStore'

const seededEmployees = employees.slice(0, 3)
const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const atLocalTime = (date: Date, hours: number, minutes: number) => {
  const value = new Date(date)
  value.setHours(hours, minutes, 0, 0)
  return value.toISOString()
}
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date
}

function makeAttendance(): ModuleRow[] {
  const rows: ModuleRow[] = []
  seededEmployees.forEach((employee, employeeIndex) => {
    for (let offset = 1; offset <= 92; offset += 1) {
      const date = daysAgo(offset)
      const weekday = date.getDay()
      if (weekday === 0 || weekday === 6) continue
      const cycle = (offset + employeeIndex * 3) % 23
      let status = 'Present'
      if (cycle === 2) status = 'Late'
      else if (cycle === 7) status = 'Half-day'
      else if (cycle === 12) status = 'Absent'
      else if (cycle === 16) status = 'On Leave'
      else if (cycle === 19) status = 'WFH'
      const checkInHour = cycle === 2 ? 9 : 8
      const checkInMinute = cycle === 2 ? 24 + employeeIndex * 3 : 52 + ((offset + employeeIndex) % 8)
      const checkInAt = ['Absent', 'On Leave'].includes(status) ? undefined : atLocalTime(date, checkInHour, checkInMinute)
      const workMinutes = status === 'Half-day' ? 245 : 480 + ((offset * 7 + employeeIndex * 11) % 65)
      const checkOutAt = checkInAt && status !== 'Half-day'
        ? new Date(new Date(checkInAt).getTime() + workMinutes * 60_000).toISOString()
        : status === 'Half-day' && checkInAt ? new Date(new Date(checkInAt).getTime() + workMinutes * 60_000).toISOString() : undefined
      const hours = checkInAt && checkOutAt ? ((new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 3_600_000).toFixed(1) : '—'
      rows.push({
        id: `AT-${employee.id}-${toDateKey(date)}`, employeeId: employee.id,
        name: `${employee.firstName} ${employee.lastName}`, department: employee.dept,
        date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        dateKey: toDateKey(date), status, checkInAt, checkOutAt, breakMinutes: checkInAt ? 60 : 0,
        detail: checkInAt ? `${new Date(checkInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — ${checkOutAt ? new Date(checkOutAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'In progress'} · ${hours} hrs` : status,
      })
    }
  })
  return rows
}

const leaveSeed = [
  ['E-1001', 'Annual Leave', -24, -22, 3, 'Family visit', 'Approved'],
  ['E-1001', 'Sick Leave', -51, -50, 2, 'Medical appointment and recovery', 'Approved'],
  ['E-1001', 'Casual Leave', -78, -78, 1, 'Personal errand', 'Rejected'],
  ['E-1001', 'Paid Leave', 3, 4, 2, 'Planned family travel', 'Pending'],
  ['E-1001', 'Casual Leave', -8, -8, 1, 'Home maintenance', 'Approved'],
  ['E-1001', 'Unpaid Leave', -37, -37, 1, 'Personal commitment', 'Cancelled'],
  ['E-1003', 'Sick Leave', -16, -15, 2, 'Medical appointment', 'Approved'],
  ['E-1002', 'Casual Leave', 8, 8, 1, 'Personal appointment', 'Pending'],
] as const

function makeLeaves() {
  return leaveSeed.map(([employeeId, leaveType, startOffset, endOffset, numberOfDays, reason, status], index) => {
    const employee = seededEmployees.find((item) => item.id === employeeId)!
    const startDate = toDateKey(daysAgo(-startOffset))
    const endDate = toDateKey(daysAgo(-endOffset))
    return {
      id: `LV-SEED-${index + 1}`, employeeId, employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeEmail: employee.email, employeePhone: employee.phone, leaveType, startDate, endDate,
      numberOfDays, reason, status, appliedDate: toDateKey(daysAgo(90 - index * 8)),
      approverName: employee.manager ?? 'Priya Sharma', adminRemarks: status === 'Rejected' ? 'Please coordinate dates with your manager.' : '',
      balanceApplied: status === 'Approved',
    }
  })
}

function makePayroll(): PayrollRecord[] {
  const output: PayrollRecord[] = []
  const periods = [-2, -1, 0]
  seededEmployees.forEach((employee, employeeIndex) => periods.forEach((monthOffset) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() + monthOffset)
    const baseline = payrollSeed.find((item) => item.employeeId === employee.id) ?? payrollSeed[employeeIndex % payrollSeed.length]
    const adjustment = monthOffset * 75
    const record: PayrollRecord = {
      ...baseline, id: `PR-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${employee.id}`,
      employeeId: employee.id, employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.dept, designation: employee.title,
      period: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      basic: baseline.basic + adjustment, hra: baseline.hra + Math.round(adjustment * 0.4),
      specialAllowance: baseline.specialAllowance, otherAllowances: baseline.otherAllowances,
      bonus: monthOffset === -1 ? 250 : 0, overtime: 90 + employeeIndex * 25,
      status: monthOffset === 0 ? 'Approved' : 'Simulated',
      paymentDate: monthOffset === 0 ? undefined : toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 2)),
      referenceId: `SEED-${employee.id}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`,
      remarks: monthOffset === 0 ? 'Current period payroll statement' : 'Seeded demo payslip; no payment transaction was sent.',
      paidDays: 24 + (monthOffset === -1 ? 1 : 0), workingDays: 26, unpaidDays: 0,
    }
    output.push(record)
  }))
  return output
}

const holidaySeed: HRHoliday[] = [
  ['New Year’s Day', '2026-01-01', 'National holiday'], ['Republic Day', '2026-01-26', 'National holiday'],
  ['Holi', '2026-03-04', 'Optional holiday'], ['Good Friday', '2026-04-03', 'Optional holiday'],
  ['Labour Day', '2026-05-01', 'Company holiday'], ['Independence Day', '2026-08-15', 'National holiday'],
  ['Gandhi Jayanti', '2026-10-02', 'National holiday'], ['Diwali', '2026-10-20', 'Company holiday'],
  ['Christmas Day', '2026-12-25', 'Company holiday'],
].map(([name, date, type], index) => ({ id: `HOL-SEED-${index + 1}`, name, date, type, description: `${type} observed by the organization.` }))

const announcementSeed: HRAnnouncement[] = [
  ['Quarterly town hall and planning update', 'Notice', 'High', -4],
  ['Work-from-home and hybrid policy update', 'Policy', 'Normal', -7],
  ['October payroll processing schedule', 'Notice', 'Normal', -10],
  ['Festival celebration and team event', 'Event', 'Low', -12],
  ['Annual information security refresher', 'Policy', 'High', -17],
  ['Benefits enrollment window is open', 'Notice', 'Normal', -21],
].map(([title, category, priority, offset], index) => {
  const date = daysAgo(Math.abs(Number(offset)))
  return { id: `ANN-SEED-${index + 1}`, title: String(title), category: String(category), priority: priority as HRAnnouncement['priority'], publishDate: toDateKey(date), expiryDate: toDateKey(daysAgo(-45)), audience: 'All employees', status: 'Published', description: `${title}. Please review the details and contact People Operations if you need help or an accommodation.` }
})

function ensure(key: string, value: unknown) {
  if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value))
}

function ensureConfiguredLeaveBalances() {
  const configuredBalances: Array<BalanceSeed> = [
    { type: 'Annual Leave', entitled: 18, used: 0, carryForward: 2 },
    { type: 'Earned Leave', entitled: 15, used: 0, carryForward: 0 },
    { type: 'Emergency Leave', entitled: 4, used: 0, carryForward: 0 },
    { type: 'Maternity / Paternity Leave', entitled: 12, used: 0, carryForward: 0 },
  ]
  try {
    const profiles = JSON.parse(localStorage.getItem('hrm-employee-ess-seed') ?? '[]') as Array<Record<string, unknown>>
    if (!Array.isArray(profiles)) return
    const next = profiles.map((profile) => {
      const current = Array.isArray(profile.leaveBalances) ? profile.leaveBalances as BalanceSeed[] : []
      const currentTypes = new Set(current.map((balance) => balance.type))
      const additions = configuredBalances.filter((balance) => !currentTypes.has(balance.type))
      return additions.length ? { ...profile, leaveBalances: [...current, ...additions] } : profile
    })
    if (JSON.stringify(next) !== JSON.stringify(profiles)) localStorage.setItem('hrm-employee-ess-seed', JSON.stringify(next))
  } catch {
    // Leave a malformed or inaccessible user store untouched.
  }
}

function normalizeSeededAttendanceKeys() {
  try {
    const rows = JSON.parse(localStorage.getItem('hrm-attendance') ?? '[]') as Array<ModuleRow>
    let changed = false
    const next = rows.map((row) => {
      if (!row.id.startsWith('AT-E-') || !row.date) return row
      const date = new Date(`${row.date} 12:00:00`)
      if (Number.isNaN(date.getTime())) return row
      const dateKey = toDateKey(date)
      if (row.dateKey === dateKey) return row
      changed = true
      return { ...row, dateKey }
    })
    if (changed) {
      localStorage.setItem('hrm-attendance', JSON.stringify(next))
      window.dispatchEvent(new Event('hrm:data-change'))
    }
  } catch {
    // Keep malformed or inaccessible attendance data untouched.
  }
}

type BalanceSeed = { type: string; entitled: number; used: number; carryForward: number }

/** Populate local demo API records once. Existing user data is always preserved. */
export function seedEmployeeDemoData() {
  ensure('hrm-attendance', makeAttendance())
  normalizeSeededAttendanceKeys()
  ensure('hrm-leave', makeLeaves())
  ensure('hrm-payroll-records', makePayroll())
  ensure('hrm-content', { holidays: holidaySeed, announcements: announcementSeed } satisfies HRContentSnapshot)
  hrContentStore.reload()
  ensure('hrm-documents', seededEmployees.flatMap((employee) => [
    { id: `DOC-${employee.id}-ID`, name: `${employee.firstName} ${employee.lastName} · Identity proof`, department: 'Employee Records', detail: 'Personal · Verified', date: 'Oct 01, 2026', status: 'Verified', employeeId: employee.id },
    { id: `DOC-${employee.id}-OFFER`, name: `${employee.firstName} ${employee.lastName} · Offer letter`, department: 'Employee Records', detail: 'Employment · Verified', date: 'Sep 12, 2026', status: 'Verified', employeeId: employee.id },
    { id: `DOC-${employee.id}-CERT`, name: `${employee.firstName} ${employee.lastName} · Certification`, department: 'Employee Records', detail: 'Training · Pending review', date: 'Aug 18, 2026', status: 'Pending', employeeId: employee.id },
    { id: `DOC-${employee.id}-ADDRESS`, name: `${employee.firstName} ${employee.lastName} · Address proof`, department: 'Employee Records', detail: 'Personal · Verified', date: 'Jul 22, 2026', status: 'Verified', employeeId: employee.id },
  ]))
  ensure('hrm-employee-ess-seed', seededEmployees.map((employee, index) => ({
    employeeId: employee.id,
    leaveBalances: [
      { type: 'Casual Leave', entitled: 12, used: index + 2, carryForward: 1 },
      { type: 'Sick Leave', entitled: 8, used: 1, carryForward: 0 },
      { type: 'Paid Leave', entitled: 18, used: index + 3, carryForward: 2 },
      { type: 'Unpaid Leave', entitled: 0, used: 0, carryForward: 0 },
      { type: 'Comp-off', entitled: 2, used: 0, carryForward: 0 },
    ],
    shift: { name: employee.shift ?? 'General Office', start: '09:00', end: '18:00', breakMinutes: 60, graceMinutes: 15, workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], weeklyOff: ['Saturday', 'Sunday'] },
    emergencyContacts: [{ name: employee.emergencyContactName ?? 'Family contact', relationship: 'Family', phone: employee.emergencyContactPhone ?? '+1 555-0109' }],
    bank: { bankName: 'Example National Bank', maskedAccount: '•••• 4821', ifsc: 'EXAM0000123', taxId: '•••••4321' },
    skills: ['Communication', 'Problem solving', employee.dept === 'Engineering' ? 'TypeScript' : 'Project coordination'],
    goals: [{ id: `GOAL-${employee.id}-1`, title: 'Complete quarterly priorities', progress: 65, dueDate: '2026-12-15' }],
    assets: [{ id: `ASSET-${employee.id}-1`, name: 'Laptop', issuedOn: '2026-01-12', status: 'Assigned' }, { id: `ASSET-${employee.id}-2`, name: 'Employee ID card', issuedOn: '2026-01-12', status: 'Assigned' }],
  })))
  ensureConfiguredLeaveBalances()
  ensure('hrm-notifications', seededEmployees.flatMap((employee) => [
    { id: `NT-${employee.id}-PAY`, recipientUserId: employee.id, recipientRole: 'EMPLOYEE', type: 'PAYSLIP_AVAILABLE', title: 'October payslip is ready', message: 'Your payroll statement is available in Payroll & Payslips.', createdAt: new Date().toISOString(), readAt: null, status: 'UNREAD', actionUrl: '/employee/payroll' },
    { id: `NT-${employee.id}-POL`, recipientUserId: employee.id, recipientRole: 'EMPLOYEE', type: 'ANNOUNCEMENT_PUBLISHED', title: 'Security refresher assigned', message: 'Review the latest information security guidance.', createdAt: new Date(Date.now() - 86_400_000).toISOString(), readAt: null, status: 'UNREAD', actionUrl: '/employee/announcements' },
  ]))
}
