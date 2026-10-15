import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getPortalLandingPath } from '@/app/auth/access'
import { useRBAC } from '@/hooks/use-rbac'

export function PermissionRoute({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const { user, hasPermission, isAdminPortalUser } = useRBAC()
  if (isAdminPortalUser && hasPermission(permission)) return children
  return <Navigate to={isAdminPortalUser ? getPortalLandingPath(user) : '/employee/dashboard'} replace />
}
