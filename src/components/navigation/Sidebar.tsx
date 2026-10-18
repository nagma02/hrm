import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, BadgeCheck, Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, FileText, LayoutDashboard, Megaphone, Sun, Users, Wallet } from 'lucide-react'
import { useRBAC } from '@/hooks/use-rbac'

const adminLinks = [
  ['Dashboard','/app/dashboard',LayoutDashboard],['Employees','/app/employees',Users],['Attendance','/app/attendance',Clock3],['Comp Off Requests','/app/comp-off/approvals',CalendarDays],['Shifts','/app/shifts',Clock3],['Departments','/app/departments',Building2],['Designations','/app/designations',BadgeCheck],['Payroll','/app/payroll',Wallet],['Approvals','/app/payroll/approvals',BadgeCheck],['Documents','/app/documents',FileText],['Holidays','/app/holidays',Sun],['Announcements','/app/announcements',Megaphone],['User Sessions','/app/user-sessions',Users],
] as const
const employeeLinks = [
  ['Dashboard','/employee/dashboard',LayoutDashboard],['Attendance','/employee/attendance',Activity],['Leave','/employee/leave',CalendarDays],['Shifts','/employee/shifts',Clock3],['Payments','/employee/payments',Wallet],['Payroll','/employee/payroll',Wallet],['Documents','/employee/documents',FileText],['Holidays','/employee/holidays',Sun],['Announcements','/employee/announcements',Megaphone],
] as const
const leaveChildren = [
  ['Leave','/app/leave',CalendarDays],
  ['Leave Approvals','/app/leave/approvals',BadgeCheck],
] as const
const attendanceChildren = [
  ['Daily Attendance', '/app/attendance'],
  ['Monthly Calendar', '/app/attendance/monthly-calendar'],
  ['Attendance Sheet', '/app/attendance/sheet'],
  ['Missing Punch Requests', '/app/attendance/missing-punch-requests'],
  ['User Monthly Report', '/app/attendance/user-monthly-report'],
] as const
const payrollChildren = [
  ['Payroll Management', '/app/payroll/management'],
  ['Loan & Advances', '/app/payroll/loans'],
  ['Payroll Settings', '/app/payroll/settings'],
  ['Payment Management', '/app/payments'],
  ['Employee Deductions', '/app/payroll/deductions'],
] as const
const approvalChildren = [['Payroll Approvals', '/app/payroll/approvals']] as const
const adminPermissionByPath: Record<string, string> = {
  '/app/dashboard': 'dashboard.view',
  '/app/employees': 'employee.view',
  '/app/attendance': 'attendance.view',
  '/app/comp-off/approvals': 'leave.approve',
  '/app/shifts': 'shift.view',
  '/app/departments': 'department.view',
  '/app/designations': 'designation.view',
  '/app/payroll': 'payroll.view',
  '/app/payroll/management': 'payroll.view',
  '/app/payroll/approvals': 'payroll.view',
  '/app/documents': 'employee.view',
  '/app/holidays': 'holiday.view',
  '/app/announcements': 'announcement.view',
  '/app/user-sessions': 'settings.view',
}

export type SidebarItem = readonly [label: string, href: string, icon: typeof LayoutDashboard]

export default function Sidebar({ onNavigate, items }: { onNavigate?: () => void; items?: ReadonlyArray<SidebarItem> } = {}) {
  const { pathname } = useLocation()
  const { hasPermission, isAdminPortalUser } = useRBAC()
  const links = items ?? (isAdminPortalUser
    ? adminLinks.filter(([, href]) => hasPermission(adminPermissionByPath[href] ?? ''))
    : [])
  const isCustomMenu = Boolean(items)
  const leaveVisible = !isCustomMenu && isAdminPortalUser && (hasPermission('leave.view') || hasPermission('leave.approve'))
  const attendanceVisible = !isCustomMenu && isAdminPortalUser && hasPermission('attendance.view')
  const payrollVisible = !isCustomMenu && isAdminPortalUser && hasPermission('payroll.view')
  const payrollOpen = pathname.startsWith('/app/payroll') || pathname === '/app/payments'
  const approvalsOpen = pathname.startsWith('/app/payroll/approvals')
  const leaveOpen = pathname === '/app/leave' || pathname.startsWith('/app/leave/') || pathname === '/employee/leave' || pathname.startsWith('/employee/leave/')
  const attendanceOpen = pathname === '/app/attendance' || pathname.startsWith('/app/attendance/')
  const [collapsed, setCollapsed] = useState(false)
  const [leaveExpanded, setLeaveExpanded] = useState(leaveOpen)
  const [attendanceExpanded, setAttendanceExpanded] = useState(attendanceOpen)
  const [payrollExpanded, setPayrollExpanded] = useState(payrollOpen)
  const [approvalsExpanded, setApprovalsExpanded] = useState(approvalsOpen)

  useEffect(() => {
    const toggle = () => setCollapsed((value) => !value)
    window.addEventListener('hrm:sidebar-toggle', toggle)
    return () => window.removeEventListener('hrm:sidebar-toggle', toggle)
  }, [])

  useEffect(() => {
    if (leaveOpen) setLeaveExpanded(true)
  }, [leaveOpen])

  useEffect(() => {
    if (attendanceOpen) setAttendanceExpanded(true)
  }, [attendanceOpen])

  useEffect(() => { if (payrollOpen) setPayrollExpanded(true) }, [payrollOpen])
  useEffect(() => { if (approvalsOpen) setApprovalsExpanded(true) }, [approvalsOpen])

  return <div className={`side-nav ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="brand"><span className="brand-mark brand-mark--logo"><img src="/logo-sidebar.png" alt="Upgrate" /></span>{!collapsed && <span className="brand-copy">HRM<small>Human Resource Management</small></span>}</div>
    <div className="nav-label">WORKSPACE</div>
    <nav aria-label="Main navigation">
      {links.map(([label, href, Icon]) => {
        const isAttendanceGroup = label === 'Attendance' && attendanceVisible
        const shouldRenderLeaveGroup = label === 'Attendance' && leaveVisible
        const isPayrollGroup = label === 'Payroll' && payrollVisible
        const isApprovalsGroup = label === 'Approvals' && payrollVisible

        return (
          <div key={href}>
            {isAttendanceGroup ? (
              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-item--parent ${attendanceOpen ? 'active' : ''}`}
                  title="Attendance"
                  aria-expanded={attendanceExpanded}
                  onClick={() => {
                    if (!collapsed) setAttendanceExpanded((value) => !value)
                    else setAttendanceExpanded(true)
                    onNavigate?.()
                  }}
                >
                  <Icon size={18} />
                  {!collapsed && <><span>Attendance</span><ChevronDown size={15} className={`nav-chevron ${attendanceExpanded ? 'is-open' : ''}`} /></>}
                </button>
                {!collapsed && <div className={`nav-submenu ${attendanceExpanded ? 'is-open' : ''}`} inert={!attendanceExpanded} aria-hidden={!attendanceExpanded}>
                  {attendanceChildren.map(([subLabel, subHref]) => (
                    <NavLink key={subHref} to={subHref} end title={subLabel} onClick={onNavigate} className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}>
                      <span>{subLabel}</span>
                    </NavLink>
                  ))}
                </div>}
              </div>
            ) : isPayrollGroup || isApprovalsGroup ? (
              <div className="nav-group">
                <button type="button" className={`nav-item nav-item--parent ${(isPayrollGroup && payrollOpen) || (isApprovalsGroup && approvalsOpen) ? 'active' : ''}`} title={label} aria-expanded={isPayrollGroup ? payrollExpanded : approvalsExpanded} onClick={() => {
                  if (isPayrollGroup) setPayrollExpanded((value) => !value)
                  else setApprovalsExpanded((value) => !value)
                }}>
                  <Icon size={18} />{!collapsed && <><span>{label}</span><ChevronDown size={15} className={`nav-chevron ${(isPayrollGroup ? payrollExpanded : approvalsExpanded) ? 'is-open' : ''}`} /></>}
                </button>
                {!collapsed && <div className={`nav-submenu ${(isPayrollGroup ? payrollExpanded : approvalsExpanded) ? 'is-open' : ''}`} inert={!(isPayrollGroup ? payrollExpanded : approvalsExpanded)} aria-hidden={!(isPayrollGroup ? payrollExpanded : approvalsExpanded)}>
                  {(isPayrollGroup ? payrollChildren : approvalChildren).map(([subLabel, subHref]) => <NavLink key={subHref} to={subHref} end title={subLabel} onClick={onNavigate} className={({ isActive }) => `nav-subitem ${isActive ? 'active' : ''}`}><span>{subLabel}</span></NavLink>)}
                </div>}
              </div>
            ) : (
              <NavLink to={href} end={href === '/app/dashboard'} title={label} onClick={onNavigate} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            )}

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
                  <div className={`nav-submenu ${leaveExpanded ? 'is-open' : ''}`} inert={!leaveExpanded} aria-hidden={!leaveExpanded}>
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
