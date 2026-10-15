import type { ReactNode } from 'react'
import { useRBAC } from '@/hooks/use-rbac'

export function RequirePermissions({
  permissions,
  entitlements = [],
  children,
  fallback = null,
  requireAll = true,
}: {
  permissions: string[]
  entitlements?: string[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}) {
  const { hasPermission, hasEntitlement } = useRBAC()
  const permissionChecks = requireAll
    ? permissions.every(hasPermission)
    : permissions.some(hasPermission)
  const allowed = permissionChecks && entitlements.every(hasEntitlement)
  return allowed ? children : fallback
}
