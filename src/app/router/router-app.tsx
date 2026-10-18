import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from '@/features/auth/pages/LoginPage'
import { PageSkeleton } from '@/components/ui/skeleton'
import { GuestRoute } from './guest-route'
import { ProtectedRoute } from './protected-route'
import { PermissionRoute } from './permission-route'
import { getPortalLandingPath } from '@/app/auth/access'
import { useAuth } from '@/app/providers/use-auth'
import EmployeeLayout from '@/employee/layout/EmployeeLayout'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'
import type { User } from '@/types/auth'

/** Lazily load a named export so every page ships in its own chunk. */
function lazyNamed<K extends string, P extends object>(load: () => Promise<Record<K, ComponentType<P>>>, name: K) {
  return lazy(async () => ({ default: (await load())[name] }))
}

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const EmployeesPage = lazy(() => import('@/features/employees/pages/EmployeesPage'))
const EmployeeCreatePage = lazy(() => import('@/features/employees/pages/EmployeeCreatePage'))
const EmployeeDetailsPage = lazy(() => import('@/features/employees/pages/EmployeeDetailsPage'))
const EmployeeEditPage = lazy(() => import('@/features/employees/pages/EmployeeEditPage'))
const ModulePage = lazy(() => import('@/features/shared/ModulePage'))
const ForgotPasswordPage = lazyNamed(() => import('@/features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage')
const LegalPolicyPage = lazyNamed(() => import('@/features/auth/pages/LegalPolicyPage'), 'LegalPolicyPage')
const NotFoundPage = lazyNamed(() => import('@/features/system/pages/NotFoundPage'), 'NotFoundPage')
const UnauthorizedPage = lazyNamed(() => import('@/features/system/pages/UnauthorizedPage'), 'UnauthorizedPage')
const loadLeave = () => import('@/features/leave')
const CompOffApprovalPage = lazyNamed(loadLeave, 'CompOffApprovalPage')
const LeaveApprovalPage = lazyNamed(loadLeave, 'LeaveApprovalPage')
const LeaveApplyPage = lazyNamed(loadLeave, 'LeaveApplyPage')
const LeaveDetailsPage = lazyNamed(loadLeave, 'LeaveDetailsPage')
const LeavePage = lazyNamed(loadLeave, 'LeavePage')
const AttendanceCorrectionPage = lazyNamed(() => import('@/features/attendance/pages/AttendanceCorrectionPage'), 'AttendanceCorrectionPage')
const AttendanceDetailsPage = lazyNamed(() => import('@/features/attendance/pages/AttendanceDetailsPage'), 'AttendanceDetailsPage')
const loadAttendanceViews = () => import('@/features/attendance/pages/AttendanceViewsPage')
const AttendanceSheetPage = lazyNamed(loadAttendanceViews, 'AttendanceSheetPage')
const MonthlyAttendanceCalendarPage = lazyNamed(loadAttendanceViews, 'MonthlyAttendanceCalendarPage')
const UserMonthlyAttendanceReportPage = lazyNamed(loadAttendanceViews, 'UserMonthlyAttendanceReportPage')
const PayrollReportsPage = lazyNamed(() => import('@/features/payroll/pages/PayrollReportsPage'), 'PayrollReportsPage')
const PayrollPage = lazyNamed(() => import('@/features/payroll/pages/PayrollPage'), 'PayrollPage')
const PaymentsPage = lazyNamed(() => import('@/features/payroll/pages/PaymentsPage'), 'PaymentsPage')
const PayrollDetailPage = lazyNamed(() => import('@/features/payroll/pages/PayrollDetailPage'), 'PayrollDetailPage')
const loadPayrollNav = () => import('@/features/payroll/pages/PayrollNavPages')
const EmployeeDeductionsPage = lazyNamed(loadPayrollNav, 'EmployeeDeductionsPage')
const PayrollApprovalsPage = lazyNamed(loadPayrollNav, 'PayrollApprovalsPage')
const PayrollLoansPage = lazyNamed(loadPayrollNav, 'PayrollLoansPage')
const PayrollSettingsPage = lazyNamed(loadPayrollNav, 'PayrollSettingsPage')
const HolidaysPage = lazy(() => import('@/features/hr-content/pages/HolidaysPage'))
const AnnouncementsPage = lazy(() => import('@/features/hr-content/pages/AnnouncementsPage'))
const EmployeeDashboardPage = lazy(() => import('@/employee/pages/DashboardPage'))
const EmployeeAttendancePage = lazy(() => import('@/employee/pages/AttendancePage'))
const EmployeeLeavePage = lazy(() => import('@/employee/pages/LeavePage'))
const EmployeeLeaveRequestsPage = lazy(() => import('@/employee/pages/LeaveRequestsPage'))
const EmployeeShiftsPage = lazy(() => import('@/employee/pages/ShiftsPage'))
const EmployeePayrollPage = lazy(() => import('@/employee/pages/PayrollPage'))
const EmployeeDocumentsPage = lazy(() => import('@/employee/pages/DocumentsPage'))
const EmployeeHolidaysPage = lazy(() => import('@/employee/pages/HolidaysPage'))
const EmployeeAnnouncementsPage = lazy(() => import('@/employee/pages/AnnouncementsPage'))
const EmployeeProfilePage = lazy(() => import('@/employee/pages/ProfilePage'))
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage'))
const UserSessionsPage = lazy(() => import('@/features/auth/pages/UserSessionsPage'))

export function RouterApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route
          path="/terms-of-use"
          element={
            <GuestRoute>
              <LegalPolicyPage type="terms" />
            </GuestRoute>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <GuestRoute>
              <LegalPolicyPage type="privacy" />
            </GuestRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="/app" element={<PortalHomeRedirect />} />
          <Route path="/app/admin/*" element={<AdminRouteRedirect />} />
          <Route path="/app/profile" element={<EmployeeProfilePage />} />
          <Route path="/app/employee-dashboard" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/app/employee-profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/app/employee-attendance" element={<Navigate to="/employee/attendance" replace />} />
          <Route path="/app/employee-attendance/corrections" element={<Navigate to="/employee/attendance" replace />} />
          <Route path="/app/employee-leave" element={<Navigate to="/employee/leave" replace />} />
          <Route path="/app/employee-leave/apply" element={<Navigate to="/employee/leave/requests" replace />} />
          <Route path="/app/employee-payroll" element={<Navigate to="/employee/payroll" replace />} />
          <Route path="/app/employee-documents" element={<Navigate to="/employee/documents" replace />} />
          <Route path="/app/employee-holidays" element={<Navigate to="/employee/holidays" replace />} />
          <Route path="/app/employee-announcements" element={<Navigate to="/employee/announcements" replace />} />
          <Route path="/app/employee-settings" element={<Navigate to="/employee/settings" replace />} />
          <Route path="/app/my-settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/app/my-profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/app/my-attendance" element={<Navigate to="/employee/attendance" replace />} />
          <Route path="/app/my-leave" element={<Navigate to="/employee/leave" replace />} />
          <Route path="/app/my-payroll" element={<Navigate to="/employee/payroll" replace />} />
          <Route path="/app/payments" element={<PermissionRoute permission="payroll.view"><PaymentsPage /></PermissionRoute>} />
          <Route path="/app/my-documents" element={<Navigate to="/employee/documents" replace />} />
          <Route path="/app/my-holidays" element={<Navigate to="/employee/holidays" replace />} />
          <Route path="/app/holiday-calendar" element={<Navigate to="/employee/holidays" replace />} />
          <Route path="/app/my-announcements" element={<Navigate to="/employee/announcements" replace />} />
          <Route path="/app/dashboard" element={<PermissionRoute permission="dashboard.view"><DashboardPage /></PermissionRoute>} />
          <Route path="/app/holidays" element={<PermissionRoute permission="holiday.view"><HolidaysPage /></PermissionRoute>} />
          <Route path="/app/announcements" element={<PermissionRoute permission="announcement.view"><AnnouncementsPage /></PermissionRoute>} />
          <Route path="/app/notifications" element={<PermissionRoute permission="dashboard.view"><NotificationsPage portal="admin" /></PermissionRoute>} />
          <Route path="/app/user-sessions" element={<PermissionRoute permission="settings.view"><UserSessionsPage /></PermissionRoute>} />
          <Route path="/app/documents/*" element={<PermissionRoute permission="employee.view"><ModuleRoute module="documents" /></PermissionRoute>} />
          <Route
            path="/app/employees"
            element={
              <PermissionRoute permission="employee.view">
                <EmployeesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/employees/create"
            element={
              <PermissionRoute permission="employee.manage">
                <EmployeeCreatePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/employees/:id/edit"
            element={
              <PermissionRoute permission="employee.manage">
                <EmployeeEditPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/employees/:id"
            element={
              <PermissionRoute permission="employee.view">
                <EmployeeDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/attendance/monthly-calendar"
            element={<PermissionRoute permission="attendance.view"><MonthlyAttendanceCalendarPage /></PermissionRoute>}
          />
          <Route
            path="/app/attendance/sheet"
            element={<PermissionRoute permission="attendance.view"><AttendanceSheetPage /></PermissionRoute>}
          />
          <Route
            path="/app/attendance/missing-punch-requests"
            element={<PermissionRoute permission="attendance.view"><AttendanceCorrectionPage missingPunchMode /></PermissionRoute>}
          />
          <Route
            path="/app/attendance/user-monthly-report"
            element={<PermissionRoute permission="attendance.view"><UserMonthlyAttendanceReportPage /></PermissionRoute>}
          />
          <Route
            path="/app/attendance/corrections"
            element={
              <PermissionRoute permission="attendance.view">
                <AttendanceCorrectionPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/attendance/:id"
            element={
              <PermissionRoute permission="attendance.view">
                <AttendanceDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/attendance"
            element={
              <PermissionRoute permission="attendance.view">
                <ModuleRoute module="attendance" />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/leave/apply"
            element={
              <PermissionRoute permission="leave.view">
                <LeaveApplyPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/leave/approvals"
            element={
              <PermissionRoute permission="leave.approve">
                <LeaveApprovalPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/comp-off/approvals"
            element={<PermissionRoute permission="leave.approve"><CompOffApprovalPage /></PermissionRoute>}
          />
          <Route
            path="/app/leave/:id"
            element={
              <PermissionRoute permission="leave.view">
                <LeaveDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/leave"
            element={
              <PermissionRoute permission="leave.view">
                <LeavePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/shifts/*"
            element={
              <PermissionRoute permission="shift.view">
                <ModuleRoute module="shifts" />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/departments/*"
            element={
              <PermissionRoute permission="department.view">
                <ModuleRoute module="departments" />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/designations/*"
            element={
              <PermissionRoute permission="designation.view">
                <ModuleRoute module="designations" />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/payroll/management"
            element={<PermissionRoute permission="payroll.view"><PayrollPage /></PermissionRoute>}
          />
          <Route
            path="/app/payroll/reports"
            element={
              <PermissionRoute permission="payroll.view">
                <PayrollReportsPage />
              </PermissionRoute>
            }
          />
          <Route path="/app/payroll/approvals" element={<PermissionRoute permission="payroll.view"><PayrollApprovalsPage /></PermissionRoute>} />
          <Route path="/app/payroll/loans" element={<PermissionRoute permission="payroll.view"><PayrollLoansPage /></PermissionRoute>} />
          <Route path="/app/payroll/settings" element={<PermissionRoute permission="payroll.view"><PayrollSettingsPage /></PermissionRoute>} />
          <Route path="/app/payroll/deductions" element={<PermissionRoute permission="payroll.view"><EmployeeDeductionsPage /></PermissionRoute>} />
          <Route
            path="/app/payroll/:id"
            element={
              <PermissionRoute permission="payroll.view">
                <PayrollDetailPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/payroll/*"
            element={
              <PermissionRoute permission="payroll.view">
                <PayrollPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/app/settings/*"
            element={
              <PermissionRoute permission="settings.view">
                <ModuleRoute module="settings" />
              </PermissionRoute>
            }
          />
          <Route path="/app/unauthorized" element={<UnauthorizedPage />} />

          <Route path="/employee/*" element={<EmployeePortalRoutes />} />
          <Route path="/app/*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function ensureLinkedEmployeeProfile(user: User, updateUser: (updates: Partial<User>) => void) {
  if (!user) return

  const employees = employeeStore.getSnapshot()
  const existing = (user.employeeId ? employees.find((employee) => employee.id === user.employeeId) : undefined)
    ?? findCurrentEmployee(employees, user)
  if (existing) {
    if (user.employeeId !== existing.id) updateUser({ employeeId: existing.id })
    return existing
  }

  const [firstName = 'Employee', ...remaining] = (user.name ?? 'Employee User').trim().split(/\s+/)
  const lastName = remaining.join(' ') || 'User'
  const created = employeeStore.create({
    id: user.employeeId || `E-${Date.now().toString().slice(-6)}`,
    firstName,
    lastName,
    email: user.email ?? '',
    phone: user.phone ?? '',
    dept: user.department ?? 'Operations',
    title: user.jobTitle ?? 'Employee',
    joinDate: new Date().toISOString().slice(0, 10),
    location: 'Remote',
    status: 'Active',
    manager: 'Team Lead',
    employmentType: 'Full time',
    shift: 'General Office',
  })

  updateUser({ employeeId: created.id })
  return created
}

function EmployeePortalRoutes() {
  const { user, isInitializing, updateUser } = useAuth()

  useEffect(() => {
    if (isInitializing || !user) return
    ensureLinkedEmployeeProfile(user, updateUser)
  }, [isInitializing, user, updateUser])

  if (!user) return <Navigate to="/login" replace state={{ from: window.location.pathname }} />

  return (
    <EmployeeLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage portal="employee" />} />
        <Route path="/attendance" element={<EmployeeAttendancePage />} />
        <Route path="/leave" element={<EmployeeLeavePage />} />
        <Route path="/leave/requests" element={<EmployeeLeaveRequestsPage />} />
        <Route path="/shifts" element={<EmployeeShiftsPage />} />
        <Route path="/payments" element={<PaymentsPage scope="employee" />} />
        <Route path="/payroll" element={<EmployeePayrollPage />} />
        <Route path="/documents" element={<EmployeeDocumentsPage />} />
        <Route path="/holidays" element={<EmployeeHolidaysPage />} />
        <Route path="/announcements" element={<EmployeeAnnouncementsPage />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
        <Route path="/settings" element={<ModulePage module="settings" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </EmployeeLayout>
  )
}

function ModuleRoute({ module }: { module: string }) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const subroute =
    segments.at(-1) === 'edit' ? 'edit' : segments.at(-1) === 'create' ? 'create' : segments[2]
  return <ModulePage module={module} subroute={subroute} />
}

function PortalHomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={getPortalLandingPath(user)} replace />
}

function AdminRouteRedirect() {
  const location = useLocation()
  const destination = location.pathname.replace(/^\/app\/admin(?=\/|$)/, '/app')
  return <Navigate to={`${destination}${location.search}${location.hash}`} replace />
}
