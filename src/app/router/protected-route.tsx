import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { appRoutes } from '@/app/config/routes'
import { AppLayout } from '@/app/layouts'
import EmployeeLayout from '@/employee/layout/EmployeeLayout'
import { useAuth } from '@/app/providers/use-auth'
import { isAdminPortalUser } from '@/app/auth/access'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, portal } = useAuth()
  const { pathname } = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={appRoutes.login} replace state={{ from: pathname }} />
  }

  if (pathname.startsWith('/employee')) {
    return <>{children}</>
  }

  if (portal === 'employee' && pathname === '/app/my-settings') {
    return <Navigate to="/employee/settings" replace />
  }
  if (pathname === '/app/my-profile' || pathname === '/app/employee-profile') {
    return <Navigate to="/app/profile" replace />
  }

  if (pathname === '/app/profile' && (portal === 'employee' || !isAdminPortalUser(user))) {
    return <EmployeeLayout>{children}</EmployeeLayout>
  }

  if (!isAdminPortalUser(user)) {
    return <Navigate to="/employee/dashboard" replace />
  }

  return <AppLayout>{children}</AppLayout>
}
