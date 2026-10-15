import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/navigation/Sidebar'
import Header from '@/components/navigation/Header'
import { HRAssistantWidget } from '@/features/hr-assistant/components/HRAssistantWidget'
import { employeeMenuItems } from '@/employee/config/menu'

export default function EmployeeLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="app-shell app-shell--employee-portal">
      <aside className="sidebar">
        <Sidebar items={employeeMenuItems as any} />
      </aside>

      <div className="app-shell__main">
        <header className="header">
          <Header portalMode="employee" />
        </header>

        <main className="app-shell__content">
          {children ?? <Outlet />}
        </main>
      </div>

      <HRAssistantWidget />
    </div>
  )
}
