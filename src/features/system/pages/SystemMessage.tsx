import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useAuth } from '@/app/providers/use-auth'
import { getPortalLandingPath } from '@/app/auth/access'
import { Card } from '@/components/ui/card'

/** Shared not-found / unauthorized message that always offers a working way back. */
export function SystemMessage({ title, message, icon = <Compass size={22} /> }: { title: string; message: string; icon?: ReactNode }) {
  const { isAuthenticated, user, portal } = useAuth()
  const { pathname } = useLocation()
  const insideShell = pathname.startsWith('/app') || pathname.startsWith('/employee')
  const home = !isAuthenticated ? '/login' : portal === 'employee' || pathname.startsWith('/employee') ? '/employee/dashboard' : getPortalLandingPath(user)

  return (
    <div className={insideShell && isAuthenticated ? 'system-screen system-screen--inline' : 'system-screen'}>
      <Card className="system-screen__card">
        <span className="system-screen__icon" aria-hidden="true">{icon}</span>
        <h1>{title}</h1>
        <p>{message}</p>
        <Link className="button primary" to={home}>{isAuthenticated ? 'Back to dashboard' : 'Go to login'}</Link>
      </Card>
    </div>
  )
}
