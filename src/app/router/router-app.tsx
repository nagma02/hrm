import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import EmployeesPage from '@/features/employees/pages/EmployeesPage'
import EmployeeCreatePage from '@/features/employees/pages/EmployeeCreatePage'
import EmployeeDetailsPage from '@/features/employees/pages/EmployeeDetailsPage'
import EmployeeEditPage from '@/features/employees/pages/EmployeeEditPage'
import ModulePage from '@/features/shared/ModulePage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import { LegalPolicyPage } from '@/features/auth/pages/LegalPolicyPage'
import { NotFoundPage } from '@/features/system/pages/NotFoundPage'
import { UnauthorizedPage } from '@/features/system/pages/UnauthorizedPage'
import { GuestRoute } from './guest-route'
import { ProtectedRoute } from './protected-route'
import { PermissionRoute } from './permission-route'
import { LeaveApprovalPage, LeaveApplyPage, LeaveDetailsPage, LeavePage } from '@/features/leave'
import { AttendanceCorrectionPage } from '@/features/attendance/pages/AttendanceCorrectionPage'
import { AttendanceDetailsPage } from '@/features/attendance/pages/AttendanceDetailsPage'
import { PayrollReportsPage } from '@/features/payroll/pages/PayrollReportsPage'
import { PayrollPage } from '@/features/payroll/pages/PayrollPage'
import { PaymentsPage } from '@/features/payroll/pages/PaymentsPage'
import { PayrollDetailPage } from '@/features/payroll/pages/PayrollDetailPage'
import HolidaysPage from '@/features/hr-content/pages/HolidaysPage'
import AnnouncementsPage from '@/features/hr-content/pages/AnnouncementsPage'
import { getPortalLandingPath, normalizeRole } from '@/app/auth/access'
import { useAuth } from '@/app/providers/use-auth'
import EmployeeLayout from '@/employee/layout/EmployeeLayout'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'
import type { User } from '@/types/auth'
import EmployeeDashboardPage from '@/employee/pages/DashboardPage'
import EmployeeAttendancePage from '@/employee/pages/AttendancePage'
import EmployeeLeavePage from '@/employee/pages/LeavePage'
import EmployeeLeaveRequestsPage from '@/employee/pages/LeaveRequestsPage'
import EmployeeShiftsPage from '@/employee/pages/ShiftsPage'
import EmployeePayrollPage from '@/employee/pages/PayrollPage'
import EmployeeDocumentsPage from '@/employee/pages/DocumentsPage'
import EmployeeHolidaysPage from '@/employee/pages/HolidaysPage'
import EmployeeAnnouncementsPage from '@/employee/pages/AnnouncementsPage'
import EmployeeProfilePage from '@/employee/pages/ProfilePage'
import NotificationsPage from '@/features/notifications/pages/NotificationsPage'

export function RouterApp() {
  return (
    <BrowserRouter>
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
            path="/app/payroll/reports"
            element={
              <PermissionRoute permission="payroll.view">
                <PayrollReportsPage />
              </PermissionRoute>
            }
          />
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
        <Route path="/payments" element={<PaymentsPage />} />
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
