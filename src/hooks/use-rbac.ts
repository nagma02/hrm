import { useCallback, useMemo } from 'react'
import { useAuth } from '@/app/providers/use-auth'
import { useOrganization } from '@/features/organization/use-organization'
import { hasUserPermission, isAdminPortalUser, normalizeRole } from '@/app/auth/access'

export function useRBAC() {
  const { user } = useAuth()
  const { activeOrganization, hasEntitlement } = useOrganization()
  const roleClaim = normalizeRole(user?.role)
  const isOrganizationScopedRole = roleClaim === 'ORG_ADMIN' || roleClaim === 'ORG_USER'
  const globalRole = normalizeRole(user?.globalRole ?? (isOrganizationScopedRole ? '' : user?.role))
  const organizationRole = normalizeRole(activeOrganization?.role ?? user?.organizationRole ?? (isOrganizationScopedRole ? user?.role : ''))
  const scopedRole = organizationRole || roleClaim
  const roles = useMemo(() => new Set([globalRole, organizationRole, normalizeRole(user?.role)].filter(Boolean)), [globalRole, organizationRole, user?.role])
  const hasPermission = useCallback((permission: string) => hasUserPermission(user, permission, organizationRole), [organizationRole, user])

  const hasRole = useCallback((...expected: string[]) => expected.some((role) => roles.has(normalizeRole(role))), [roles])
  const hasGlobalAdminRole = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_EXECUTIVE'].includes(globalRole)
  const isOrganizationUser = !hasGlobalAdminRole && ['ORG_USER', 'EMPLOYEE'].includes(scopedRole)
  const hasAdminPortal = isAdminPortalUser(user) || hasGlobalAdminRole || scopedRole === 'ORG_ADMIN'

  return { user, globalRole, organizationRole, roles, hasRole, hasPermission, hasEntitlement, isOrganizationUser, isAdminPortalUser: hasAdminPortal }
}
