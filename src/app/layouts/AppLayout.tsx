import React, { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import Header from '@/components/navigation/Header'
import { HRAssistantWidget } from '@/features/hr-assistant/components/HRAssistantWidget'

export default function AppLayout({ children }: { children?: React.ReactNode }) {
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
    <div className="app-shell">
      <aside className={`sidebar${mobileSidebarOpen ? ' is-mobile-open' : ''}`}>
        <Sidebar onNavigate={closeMobileSidebar} />
      </aside>
      {mobileSidebarOpen && <button type="button" className="sidebar-mobile-backdrop" aria-label="Close navigation" onClick={closeMobileSidebar} />}

      <div className="app-shell__main">
        <header className="header">
          <Header />
        </header>

        <main className="app-shell__content">{children ?? <Outlet />}</main>
      </div>
      <HRAssistantWidget />
    </div>
  )
}
