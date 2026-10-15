import { employeeStore } from '@/features/employees/data/employeeStore'
import type { User } from '@/types/auth'

const globalAdminRoles = new Set(['ADMIN', 'SUPER_ADMIN'])
const adminPortalRoles = new Set(['ADMIN', 'SUPER_ADMIN', 'CUSTOMER_EXECUTIVE'])
const organizationAdminPermissions = [
  'app.view', 'dashboard.view', 'employee.view', 'employee.manage', 'attendance.view',
  'leave.view', 'leave.approve', 'shift.view', 'department.view', 'designation.view',
  'payroll.view', 'holiday.view', 'announcement.view', 'organization.view', 'organization.manage',
]

export function normalizeRole(role?: string) {
  return role?.trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_') ?? ''
}

export function hasUserPermission(user: User | null | undefined, permission: string, organizationRole?: string) {
  if (!user) return false
  const key = permission.toUpperCase()
  const role = normalizeRole(user.role)
  const globalRole = normalizeRole(user.globalRole ?? (role === 'ORG_ADMIN' || role === 'ORG_USER' ? '' : role))
  const scopedRole = normalizeRole(organizationRole ?? user.organizationRole ?? (role === 'ORG_ADMIN' || role === 'ORG_USER' ? role : ''))
  const permissions = new Set((user.permissions ?? []).map((item) => item.toUpperCase()))

  if (globalAdminRoles.has(globalRole)) return true
  if (permissions.has('*') || permissions.has(key)) return true
  return scopedRole === 'ORG_ADMIN' && organizationAdminPermissions.some((item) => item.toUpperCase() === key)
}

export function isAdminPortalUser(user: User | null | undefined) {
  if (!user) return false
  const role = normalizeRole(user.role)
  const globalRole = normalizeRole(user.globalRole ?? (role === 'ORG_ADMIN' || role === 'ORG_USER' ? '' : role))
  const organizationRole = normalizeRole(user.organizationRole ?? (role === 'ORG_ADMIN' ? role : ''))
  if (adminPortalRoles.has(globalRole) || adminPortalRoles.has(role) || organizationRole === 'ORG_ADMIN') return true
  return false
}

export function hasLinkedEmployeeProfile(user: User | null | undefined) {
  if (!user) return false

  const normalizedEmail = user.email?.trim().toLowerCase() ?? ''
  const normalizedPhone = user.phone?.replace(/\D/g, '') ?? ''

  return employeeStore.getSnapshot().some((employee) => {
    if (user.employeeId && employee.id === user.employeeId) return true
    const employeeEmail = employee.email?.trim().toLowerCase() ?? ''
    const employeePhone = employee.phone?.replace(/\D/g, '') ?? ''
    return Boolean(normalizedEmail && employeeEmail === normalizedEmail)
      || Boolean(normalizedPhone && employeePhone === normalizedPhone)
  })
}

export function canAccessEmployeePortal(user: User | null | undefined) {
  if (!user) return false
  const role = normalizeRole(user.role)
  const globalRole = normalizeRole(user.globalRole ?? (role === 'ORG_ADMIN' || role === 'ORG_USER' ? '' : role))
  const organizationRole = normalizeRole(user.organizationRole ?? (role === 'ORG_ADMIN' ? role : ''))

  if (role === 'EMPLOYEE' || globalRole === 'EMPLOYEE' || organizationRole === 'EMPLOYEE') return true
  if (!isAdminPortalUser(user)) return false
  return hasLinkedEmployeeProfile(user)
}

export function getPortalLandingPath(user: User | null | undefined) {
  if (!user) return '/login'
  if (!isAdminPortalUser(user)) return '/employee/dashboard'

  const landingRoutes = [
    ['dashboard.view', '/app/dashboard'],
    ['employee.view', '/app/employees'],
    ['attendance.view', '/app/attendance'],
    ['leave.approve', '/app/leave/approvals'],
    ['leave.view', '/app/leave'],
    ['shift.view', '/app/shifts'],
    ['department.view', '/app/departments'],
    ['designation.view', '/app/designations'],
    ['payroll.view', '/app/payroll'],
    ['holiday.view', '/app/holidays'],
    ['announcement.view', '/app/announcements'],
    ['settings.view', '/app/settings'],
  ] as const

  return landingRoutes.find(([permission]) => hasUserPermission(user, permission))?.[1] ?? '/app/dashboard'
}
