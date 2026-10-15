import { Activity, CalendarDays, Clock3, FileText, LayoutDashboard, Megaphone, Sun, Wallet } from 'lucide-react'

export const employeeMenuItems = [
  ['Dashboard', '/employee/dashboard', LayoutDashboard],
  ['Attendance', '/employee/attendance', Activity],
  ['Leave', '/employee/leave', CalendarDays],
  ['Shifts', '/employee/shifts', Clock3],
  ['Payments', '/employee/payments', Wallet],
  ['Payroll', '/employee/payroll', Wallet],
  ['Documents', '/employee/documents', FileText],
  ['Holidays', '/employee/holidays', Sun],
  ['Announcements', '/employee/announcements', Megaphone],
] as const
