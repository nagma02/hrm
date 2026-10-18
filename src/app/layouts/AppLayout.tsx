import React, { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar, { type SidebarItem } from '@/components/navigation/Sidebar'
import Header from '@/components/navigation/Header'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/app/router/error-boundary'

type AppLayoutProps = {
  children?: React.ReactNode
  /** Which portal's header and navigation to render. */
  portal?: 'admin' | 'employee'
  /** Custom sidebar menu; the admin menu is derived from permissions when omitted. */
  sidebarItems?: ReadonlyArray<SidebarItem>
}

/**
 * Shared shell for both portals: sidebar (with mobile drawer), header, and a
 * content area where each page is isolated by its own error boundary and shows a
 * skeleton wireframe while lazily loaded route code arrives.
 */
export default function AppLayout({ children, portal = 'admin', sidebarItems }: AppLayoutProps) {
  const { pathname } = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  useEffect(() => {
    const toggle = () => setMobileSidebarOpen((open) => !open)
    window.addEventListener('hrm:mobile-sidebar-toggle', toggle)
    return () => window.removeEventListener('hrm:mobile-sidebar-toggle', toggle)
  }, [])
  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false)
    window.dispatchEvent(new Event('hrm:mobile-sidebar-closed'))
  }
  return (
    <div className={`app-shell${portal === 'employee' ? ' app-shell--employee-portal' : ''}`}>
      <aside className={`sidebar${mobileSidebarOpen ? ' is-mobile-open' : ''}`}>
        <Sidebar onNavigate={closeMobileSidebar} items={sidebarItems} />
      </aside>
      {mobileSidebarOpen && <button type="button" className="sidebar-mobile-backdrop" aria-label="Close navigation" onClick={closeMobileSidebar} />}

      <div className="app-shell__main">
        <header className="header">
          <Header portalMode={portal} />
        </header>

        <main className="app-shell__content">
          <ErrorBoundary resetKey={pathname} title="This page couldn't load" message="Something went wrong while rendering this page. Your data is safe — try again or pick another page from the menu.">
            <Suspense fallback={<PageSkeleton />}>{children ?? <Outlet />}</Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
