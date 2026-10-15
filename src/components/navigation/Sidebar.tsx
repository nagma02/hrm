import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, BadgeCheck, Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileText, LayoutDashboard, Megaphone, Sun, Users, Wallet } from 'lucide-react'
import { useRBAC } from '@/hooks/use-rbac'

const adminLinks = [
  ['Dashboard','/app/dashboard',LayoutDashboard],['Employees','/app/employees',Users],['Attendance','/app/attendance',Activity],['Shifts','/app/shifts',Clock3],['Departments','/app/departments',Building2],['Designations','/app/designations',BadgeCheck],['Payroll','/app/payroll',Wallet],['Documents','/app/documents',FileText],['Holidays','/app/holidays',Sun],['Announcements','/app/announcements',Megaphone],
] as const
const employeeLinks = [
  ['Dashboard','/employee/dashboard',LayoutDashboard],['Attendance','/employee/attendance',Activity],['Leave','/employee/leave',CalendarDays],['Shifts','/employee/shifts',Clock3],['Payments','/employee/payments',Wallet],['Payroll','/employee/payroll',Wallet],['Documents','/employee/documents',FileText],['Holidays','/employee/holidays',Sun],['Announcements','/employee/announcements',Megaphone],
] as const
const leaveChildren = [
  ['Leave','/app/leave',CalendarDays],
  ['Leave Approvals','/app/leave/approvals',BadgeCheck],
] as const
const adminPermissionByPath: Record<string, string> = {
  '/app/dashboard': 'dashboard.view',
  '/app/employees': 'employee.view',
  '/app/attendance': 'attendance.view',
  '/app/shifts': 'shift.view',
  '/app/departments': 'department.view',
  '/app/designations': 'designation.view',
  '/app/payroll': 'payroll.view',
  '/app/documents': 'employee.view',
  '/app/holidays': 'holiday.view',
  '/app/announcements': 'announcement.view',
}

export default function Sidebar({ onNavigate, items }: { onNavigate?: () => void; items?: ReadonlyArray<readonly [string, string, typeof LayoutDashboard]> } = {}) {
  const { pathname } = useLocation()
  const { hasPermission, isAdminPortalUser } = useRBAC()
  const links = items ?? (isAdminPortalUser
    ? adminLinks.filter(([, href]) => hasPermission(adminPermissionByPath[href] ?? ''))
    : [])
  const isCustomMenu = Boolean(items)
  const leaveVisible = !isCustomMenu && isAdminPortalUser && (hasPermission('leave.view') || hasPermission('leave.approve'))
  const leaveOpen = pathname === '/app/leave' || pathname.startsWith('/app/leave/') || pathname === '/employee/leave' || pathname.startsWith('/employee/leave/')
  const [collapsed, setCollapsed] = useState(false)
  const [leaveExpanded, setLeaveExpanded] = useState(leaveOpen)

  useEffect(() => {
    const toggle = () => setCollapsed((value) => !value)
    window.addEventListener('hrm:sidebar-toggle', toggle)
    return () => window.removeEventListener('hrm:sidebar-toggle', toggle)
  }, [])

  useEffect(() => {
    if (leaveOpen) setLeaveExpanded(true)
  }, [leaveOpen])

  return <div className={`side-nav ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="brand"><span className="brand-mark">H</span>{!collapsed && <span className="brand-copy">HRM<small>Human Resource Management</small></span>}</div>
    <div className="nav-label">WORKSPACE</div>
    <nav aria-label="Main navigation">
      {links.map(([label, href, Icon]) => {
        const shouldRenderLeaveGroup = label === 'Attendance' && leaveVisible

        return (
          <div key={href}>
            <NavLink to={href} end={href === '/app/dashboard'} title={label} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </NavLink>

            {shouldRenderLeaveGroup && (
              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-item--parent ${leaveOpen ? 'active' : ''}`}
                  title="Leave"
                  aria-expanded={leaveExpanded}
                  onClick={() => {
                    if (!collapsed) setLeaveExpanded((value) => !value)
                    if (onNavigate) onNavigate()
                  }}
                >
                  <CalendarDays size={18} />
                  {!collapsed && <>
                    <span>Leave</span>
                    <ChevronDown size={15} className={`nav-chevron ${leaveExpanded ? 'is-open' : ''}`} />
                  </>}
                </button>

                {!collapsed && (
                  <div className={`nav-submenu ${leaveExpanded ? 'is-open' : ''}`}>
                    {leaveChildren.map(([subLabel, subHref, SubIcon]) => {
                      const visible = subLabel === 'Leave' ? hasPermission('leave.view') : hasPermission('leave.approve')
                      if (!visible) return null

                      return (
                        <NavLink
                          key={subHref}
                          to={subHref}
                          title={subLabel}
                          onClick={onNavigate}
                          className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}
                        >
                          <SubIcon size={15} />
                          <span>{subLabel}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
    <div className="sidebar-bottom">{!collapsed && <div className="sidebar-footnote">© 2026 HRM</div>}<button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button></div>
  </div>
}
