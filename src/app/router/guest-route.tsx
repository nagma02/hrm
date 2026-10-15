import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/use-auth'
import { getPortalLandingPath } from '@/app/auth/access'

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const { pathname: publicPath } = useLocation()
  const isPublicRoute = publicPath === '/' || publicPath === '/login' || publicPath === '/forgot-password'

  if (isAuthenticated && isPublicRoute) {
    return <Navigate to={getPortalLandingPath(user)} replace />
  }

  return children
}
