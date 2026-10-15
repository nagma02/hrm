import { employees as employeeDirectory } from '@/features/employees/data/employeesData'
import type { User } from '@/types/auth'

export const DEMO_ADMIN_EMAILS = new Set(['admin@company.com', 'superadmin@company.com', 'hr@company.com', 'nagmasiddiqui24@navgurukul.org'])
export const DEMO_ADMIN_PHONES = new Set(['+919876543210', '919876543210', '9876543210', '+15550100', '+918178571099', '918178571099', '8178571099'])
export const DEMO_EMPLOYEE_EMAILS = new Set(['employee@company.com', 'nagma@company.com', 'jane.cooper@example.com', 'jane@company.com'])

export function normalizeEmailAddress(value: string) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function resolveDemoEmployeeProfile(email = '', phone = '') {
  const normalizedEmail = normalizeEmailAddress(email)
  const normalizedPhone = phone.replace(/\D/g, '')

  const directMatch = employeeDirectory.find((employee) => {
    if (normalizedEmail && normalizeEmailAddress(employee.email) === normalizedEmail) return true
    if (normalizedPhone && employee.phone.replace(/\D/g, '') === normalizedPhone) return true
    return false
  })

  if (directMatch) return directMatch

  const aliasMatch = employeeDirectory.find((employee) => {
    const isDemoAlias = ['employee@company.com', 'nagma@company.com'].includes(normalizedEmail)
    return isDemoAlias && normalizeEmailAddress(employee.email) === 'jane.cooper@example.com'
  })

  return aliasMatch ?? employeeDirectory[0]
}

export function buildDemoUserFromPortal(email: string, phone = '', portal: 'admin' | 'employee' = 'employee'): User {
  const normalizedEmail = normalizeEmailAddress(email)
  const resolvedPortal = portal === 'admin' || portal === 'employee' ? portal : 'employee'

  if (resolvedPortal === 'admin') {
    const adminEmail = normalizedEmail || 'admin@company.com'
    return {
      id: 'ADMIN-DEMO',
      name: 'Admin Demo User',
      email: adminEmail,
      ...(phone ? { phone } : {}),
      role: 'SUPER_ADMIN',
      globalRole: 'SUPER_ADMIN',
      permissions: ['app.view', 'dashboard.view', 'employee.view', 'employee.manage', 'attendance.view', 'leave.view', 'leave.approve', 'shift.view', 'department.view', 'designation.view', 'payroll.view', 'payroll.process', 'holiday.view', 'announcement.view', 'settings.view', 'settings.manage'],
    }
  }

  const profile = resolveDemoEmployeeProfile(email, phone)
  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`,
    email: profile.email,
    phone: profile.phone,
    employeeId: profile.id,
    role: 'EMPLOYEE',
    globalRole: 'EMPLOYEE',
    permissions: ['dashboard.view', 'employee.view', 'attendance.view', 'leave.view', 'payroll.view'],
  }
}
