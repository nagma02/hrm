import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, LogOut, Menu, Search, Settings, UserRound, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { navigateTo } from '@/app/router/navigation'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useAuth } from '@/app/providers/use-auth'
import { useCurrentEmployee, useEmployeeDisplayName } from '@/features/employees/utils/employee-identity'
import { HelpCenterButton } from '@/features/help-center/components/HelpCenterButton'
import { NotificationMenu } from '@/features/notifications/components/NotificationMenu'
import { moduleSeeds } from '@/features/shared/data/moduleData'
import { leaveService } from '@/features/leave/services/leave.service'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { listAttendanceRows } from '@/features/attendance/services/attendance.service'
import { useHRContent } from '@/features/hr-content/hooks/useHRContent'
import OrganizationSwitcher from '@/features/organization/components/OrganizationSwitcher'
import { useRBAC } from '@/hooks/use-rbac'

type SearchResult = { id: string; label: string; detail: string; kind: string; path: string }

function formatRole(role?: string) {
  return role?.replaceAll('_', ' ').replaceAll('-', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

/** "Workspace / Employees / Add New" instead of a bare last URL segment such as "Create" or "E 1001". */
function breadcrumbTrail(pathname: string) {
  const segments = pathname.split('/').filter(Boolean).slice(1)
  const section = titleCase(segments[0] ?? 'dashboard')
  const leaf = segments.length > 1 ? segments.at(-1) ?? '' : ''
  if (!leaf) return { section, page: '' }
  if (leaf === 'create') return { section, page: 'Add New' }
  if (leaf === 'edit') return { section, page: 'Edit' }
  if (/\d/.test(leaf)) return { section, page: 'Details' }
  return { section, page: titleCase(leaf) }
}

export default function Header({ portalMode = 'admin' }: { portalMode?: 'admin' | 'employee' }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const { user, signOut, portal, setPortal } = useAuth()
  const { isAdminPortalUser } = useRBAC()
  const employee = useCurrentEmployee()
  const employeeDisplay = useEmployeeDisplayName()
  const employees = useEmployees()
  const content = useHRContent()
  useEffect(() => {
    const closeMobileSidebar = () => setMobile(false)
    window.addEventListener('hrm:mobile-sidebar-closed', closeMobileSidebar)
    return () => window.removeEventListener('hrm:mobile-sidebar-closed', closeMobileSidebar)
  }, [])
  const { section, page } = breadcrumbTrail(pathname)
  const profileName = portalMode === 'employee'
    ? (employee ? `${employee.firstName} ${employee.lastName}` : user?.name || 'Employee')
    : user?.name || 'Employee'
  const profileRole = portalMode === 'employee'
    ? employee?.title || user?.jobTitle || 'Employee'
    : formatRole(user?.organizationRole || user?.globalRole || user?.role) || employee?.title || user?.jobTitle || 'Employee'
  const profileEmail = portalMode === 'employee' ? (employee?.email || user?.email || '') : (user?.email || '')
  const profileInitials = portalMode === 'employee' ? (employeeDisplay.initials || 'E') : (user?.name?.match(/\b\w/g)?.slice(0, 2).join('').toUpperCase() || 'E')
  const scopedEmployees = portalMode === 'employee' && employee
    ? employees.filter((item) => item.id === employee.id || item.email.toLowerCase() === employee.email.toLowerCase())
    : employees
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const matches = (label: string, detail: string) => `${label} ${detail}`.toLowerCase().includes(q)
    return [
      ...scopedEmployees.filter((item) => matches(`${item.firstName} ${item.lastName}`, `${item.id} ${item.email} ${item.dept} ${item.title}`)).map((item) => ({ id: `employee-${item.id}`, label: `${item.firstName} ${item.lastName}`, detail: `${item.id} · ${item.dept}`, kind: 'Employee', path: portalMode === 'employee' ? '/app/profile' : `/app/employees/${item.id}` })),
      ...moduleSeeds.departments.filter((item) => matches(item.name, item.department)).map((item) => ({ id: `department-${item.id}`, label: item.name, detail: `${item.department} · Department`, kind: 'Department', path: '/app/departments' })),
      ...moduleSeeds.designations.filter((item) => matches(item.name, item.department)).map((item) => ({ id: `designation-${item.id}`, label: item.name, detail: `${item.department} · Designation`, kind: 'Designation', path: '/app/designations' })),
      ...leaveService.list().filter((item) => matches(item.employeeName, `${item.id} ${item.leaveType} ${item.status}`) && (portalMode !== 'employee' || item.employeeId === employee?.id || item.employeeEmail.toLowerCase() === employee?.email.toLowerCase())).map((item) => ({ id: `leave-${item.id}`, label: `${item.employeeName} · ${item.leaveType}`, detail: `${item.id} · ${item.status} leave`, kind: 'Leave', path: portalMode === 'employee' ? '/employee/leave' : `/app/leave/${item.id}` })),
      ...listAttendanceRows().filter((item) => matches(item.name, `${item.id} ${item.department} ${item.status}`) && (portalMode !== 'employee' || item.employeeId === employee?.id || item.name.toLowerCase() === `${employee?.firstName} ${employee?.lastName}`.toLowerCase())).map((item) => ({ id: `attendance-${item.id}`, label: item.name, detail: `${item.id} · ${item.status}`, kind: 'Attendance', path: portalMode === 'employee' ? '/employee/attendance' : `/app/attendance/${item.id}` })),
      ...payrollService.list().filter((item) => matches(item.employeeName, `${item.employeeId} ${item.department} ${item.period}`) && (portalMode !== 'employee' || item.employeeId === employee?.id)).map((item) => ({ id: `payroll-${item.id}`, label: `${item.employeeName} · Payroll`, detail: `${item.period} · ${item.status}`, kind: 'Payroll', path: portalMode === 'employee' ? '/employee/payroll' : `/app/payroll/${item.id}` })),
      ...content.announcements.filter((item) => matches(item.title, `${item.description} ${item.category}`)).map((item) => ({ id: `announcement-${item.id}`, label: item.title, detail: `${item.category} · Announcement`, kind: 'Announcement', path: '/app/announcements' })),
    ].slice(0, 8)
  }, [employee, employees, query, content, portalMode])

  return <>
    <div className="topbar">
      <button className="icon-button menu-toggle" onClick={() => { if (window.matchMedia('(max-width: 1100px)').matches) { setMobile(!mobile); window.dispatchEvent(new Event('hrm:mobile-sidebar-toggle')) } else window.dispatchEvent(new Event('hrm:sidebar-toggle')) }} aria-label="Toggle navigation">{mobile ? <X size={18}/> : <Menu size={18}/>}</button>
      <div className="crumbs"><span>Workspace</span><b>/</b>{page ? <><span>{section}</span><b>/</b><strong>{page}</strong></> : <strong>{section}</strong>}</div>
      <div className="topbar-right">
        <OrganizationSwitcher />
        <div className="global-search z-[99999]"><Search size={16}/><input aria-label="Search HRM" placeholder="Search anything..." value={query} onChange={(event) => setQuery(event.target.value)}/><kbd>⌘ K</kbd>{query && <div className="search-results z-[99999]">{results.map((result) => <button key={result.id} onClick={() => { setQuery(''); navigateTo(result.path) }}><span className="avatar-mini">{result.kind.slice(0, 2).toUpperCase()}</span><span>{result.label}<small>{result.kind} · {result.detail}</small></span></button>)}{!results.length && <p>No matching records</p>}</div>}</div>
        <HelpCenterButton />
        <NotificationMenu portal={portalMode} />
        <div className="menu-wrap"><button className="profile-trigger" aria-label={`Account menu for ${profileName}`} title={profileName} aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)}><span className="profile-avatar">{user?.profilePhoto ? <img src={user.profilePhoto} alt="" /> : profileInitials}</span><span className="profile-name profile-name--compact">{profileRole}{profileEmail && <small>{profileEmail}</small>}</span><ChevronDown size={15}/></button>{profileOpen && <div className="pop-menu user-menu z-[9999]"><button onClick={() => { setProfileOpen(false); navigateTo('/app/profile') }}><UserRound size={15}/> Profile</button><button onClick={() => { setProfileOpen(false); navigateTo(portalMode === 'employee' ? '/employee/settings' : '/app/settings') }}><Settings size={15}/> Settings</button>{isAdminPortalUser && portal === 'admin' && <button onClick={() => { setProfileOpen(false); setPortal('employee'); navigate('/employee/dashboard') }}><UserRound size={15}/> Employee Portal</button>}{isAdminPortalUser && portal === 'employee' && <button onClick={() => { setProfileOpen(false); setPortal('admin'); navigate('/app/dashboard') }}><UserRound size={15}/> Admin Portal</button>}<button onClick={() => { setProfileOpen(false); signOut(); navigateTo('/login') }}><LogOut size={15}/> Sign out</button></div>}</div>
      </div>
    </div>
  </>
}
