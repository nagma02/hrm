import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthContext } from '@/app/providers/auth-context'
import { AuthProvider } from '@/app/providers/auth-provider'
import { useAuth } from '@/app/providers/use-auth'
import { LoginForm } from '@/features/auth/components/LoginForm'
import Header from '@/components/navigation/Header'
import Sidebar from '@/components/navigation/Sidebar'
import { RouterApp } from '@/app/router/router-app'
import type { AuthSession } from '@/types/auth'

const authMocks = vi.hoisted(() => ({
  requestLoginOtp: vi.fn(),
  requestPhoneLoginOtp: vi.fn(),
  verifyLoginOtp: vi.fn(),
  verifyPhoneLoginOtp: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logoutAuthSession: vi.fn(),
}))

vi.mock('@/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/auth.service')>()
  return { ...actual, ...authMocks }
})
vi.mock('@/features/hr-content/hooks/useHRContent', () => ({
  useHRContent: () => ({ announcements: [] }),
}))
vi.mock('@/features/organization/components/OrganizationSwitcher', () => ({ default: () => null }))
vi.mock('@/hooks/use-rbac', () => ({
  useRBAC: () => ({
    isAdminPortalUser: true,
    isOrganizationUser: false,
    hasPermission: (permission: string) =>
      ['DASHBOARD.VIEW', 'EMPLOYEE.VIEW', 'ATTENDANCE.VIEW', 'PAYROLL.VIEW'].includes(
        permission.toUpperCase(),
      ),
  }),
}))

const adminSession: AuthSession = {
  accessToken: 'admin-token',
  user: {
    id: 'admin@example.test',
    name: 'Admin User',
    email: 'admin@example.test',
    phone: '+919876543210',
    role: 'SUPER_ADMIN',
    globalRole: 'SUPER_ADMIN',
    permissions: ['dashboard.view'],
  },
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="pathname">{location.pathname}</output>
}

function AuthControls() {
  const auth = useAuth()
  return (
    <>
      <output data-testid="auth-state">{auth.isAuthenticated ? 'signed-in' : 'signed-out'}</output>
      <output data-testid="portal-state">{auth.portal}</output>
      <button onClick={() => auth.acceptSession(adminSession)}>Accept session</button>
      <button onClick={() => auth.setPortal('employee')}>Open employee portal</button>
      <button onClick={() => auth.setPortal('admin')}>Open admin portal</button>
      <button onClick={auth.signOut}>Sign out</button>
    </>
  )
}

async function fillOtp(user: ReturnType<typeof userEvent.setup>, code: string) {
  for (const [index, digit] of [...code].entries()) {
    await user.type(screen.getByLabelText(`OTP digit ${index + 1}`), digit)
  }
}

describe('authentication portal flow', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.clearAllMocks()
    authMocks.requestLoginOtp.mockResolvedValue({ devOtp: undefined })
    authMocks.requestPhoneLoginOtp.mockResolvedValue(undefined)
    authMocks.verifyLoginOtp.mockResolvedValue(adminSession)
    authMocks.verifyPhoneLoginOtp.mockResolvedValue(adminSession)
    authMocks.fetchCurrentUser.mockImplementation(async (fallbackUser) => fallbackUser)
    authMocks.logoutAuthSession.mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('allows OTP verification without the extra consent checkbox', async () => {
    const user = userEvent.setup()
    const contextValue = {
      session: null,
      user: null,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: false,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={contextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email or mobile number'), 'admin@example.test')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    await waitFor(() => expect(screen.getByLabelText('Enter OTP (4 Digit)')).toBeInTheDocument())
    const verifyButton = screen.getByRole('button', { name: /verify otp & login/i })
    expect(verifyButton).not.toBeDisabled()

    await fillOtp(user, '1234')
    await user.click(verifyButton)

    await waitFor(() => expect(contextValue.acceptSession).toHaveBeenCalled())
  })

  it('preserves the correct digit order when typing a phone number', async () => {
    const user = userEvent.setup()
    const contextValue = {
      session: null,
      user: null,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: false,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={contextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    const phoneInput = screen.getByLabelText('Email or mobile number')
    await user.type(phoneInput, '8178571099')

    await waitFor(() => {
      expect(phoneInput).toHaveValue('8178571099')
    })
    expect(authMocks.requestPhoneLoginOtp).not.toHaveBeenCalled()
  })

  it('sends OTP via phone after typing a mobile number', async () => {
    const user = userEvent.setup()
    const contextValue = {
      session: null,
      user: null,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: false,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={contextValue}>
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    const phoneInput = screen.getByLabelText('Email or mobile number')
    await user.type(phoneInput, '9876543210')

    await user.click(screen.getByRole('button', { name: /send otp via sms/i }))

    await waitFor(() =>
      expect(authMocks.requestPhoneLoginOtp).toHaveBeenCalledWith('+919876543210'),
    )
  })

  it('restores the typed login values after visiting legal policy pages and returning', async () => {
    const user = userEvent.setup()
    const contextValue = {
      session: null,
      user: null,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: false,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
    }

    function AuthShell() {
      return (
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/terms-of-use" element={<Link to="/login">Back to login</Link>} />
          <Route path="/privacy-policy" element={<Link to="/login">Back to login</Link>} />
        </Routes>
      )
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={contextValue}>
          <AuthShell />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email or mobile number'), 'admin@example.test')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    await waitFor(() => expect(screen.getByLabelText('Enter OTP (4 Digit)')).toBeInTheDocument())
    await fillOtp(user, '1234')
    await user.click(screen.getByRole('link', { name: /terms of use/i }))
    await user.click(screen.getByRole('link', { name: /back to login/i }))

    expect(screen.getByLabelText('Email or mobile number')).toHaveValue('admin@example.test')
    expect(screen.getByLabelText('Enter OTP (4 Digit)')).toHaveValue('1234')
    expect(screen.getByText(/by signing up, you agree to our/i)).toBeInTheDocument()
  })

  it('hides the Payments menu item from the admin sidebar', () => {
    const contextValue = {
      session: adminSession,
      user: adminSession.user,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: true,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(
        (permission) =>
          permission === 'payroll.view' ||
          permission === 'dashboard.view' ||
          permission === 'employee.view' ||
          permission === 'attendance.view',
      ),
    }

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <AuthContext.Provider value={contextValue}>
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: /payments/i })).not.toBeInTheDocument()
  })

  it('keeps the login flow on a single admin screen with inline OTP and routes to dashboard', async () => {
    const user = userEvent.setup()
    const acceptSession = vi.fn()
    const contextValue = {
      session: null,
      user: null,
      portal: 'admin' as const,
      setPortal: vi.fn(),
      isAuthenticated: false,
      isInitializing: false,
      acceptSession,
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => false),
    }

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider value={contextValue}>
          <LoginForm />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Email or mobile number')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email or mobile number'), 'admin@example.test')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    await waitFor(() => expect(screen.getByLabelText('Enter OTP (4 Digit)')).toBeInTheDocument())
    await fillOtp(user, '1234')
    await user.click(screen.getByRole('button', { name: /verify otp & login/i }))

    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(adminSession))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/dashboard')
  })

  it('routes employee sign-ins to the employee portal dashboard', async () => {
    const user = userEvent.setup()
    const acceptSession = vi.fn()
    const employeeSession: AuthSession = {
      accessToken: 'employee-token',
      user: {
        id: 'employee-1',
        name: 'Jane Cooper',
        email: 'employee@company.com',
        phone: '+919900000001',
        role: 'EMPLOYEE',
        globalRole: 'EMPLOYEE',
        permissions: ['dashboard.view', 'attendance.view', 'leave.view'],
      },
    }
    authMocks.verifyLoginOtp.mockResolvedValue(employeeSession)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthContext.Provider
          value={{
            session: null,
            user: null,
            portal: 'admin',
            setPortal: vi.fn(),
            isAuthenticated: false,
            isInitializing: false,
            acceptSession,
            updateUser: vi.fn(),
            signOut: vi.fn(),
            hasPermission: vi.fn(() => false),
          }}
        >
          <LoginForm />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Email or mobile number'), 'employee@company.com')
    await user.click(screen.getByRole('button', { name: /send otp/i }))

    await waitFor(() => expect(screen.getByLabelText('Enter OTP (4 Digit)')).toBeInTheDocument())
    await fillOtp(user, '1234')
    await user.click(screen.getByRole('button', { name: /verify otp & login/i }))

    await waitFor(() => expect(acceptSession).toHaveBeenCalledWith(employeeSession))
    expect(screen.getByTestId('pathname')).toHaveTextContent('/employee/dashboard')
  })

  it('persists the admin identity and clears it on logout', async () => {
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Accept session' }))
    await waitFor(() => expect(window.localStorage.getItem('hrm.auth.session')).not.toBeNull())
    expect(JSON.parse(window.localStorage.getItem('hrm.auth.session')!).user.id).toBe(
      adminSession.user.id,
    )
    expect(window.localStorage.getItem('hrm.portal')).toBe('admin')

    await user.click(screen.getByRole('button', { name: 'Open employee portal' }))
    expect(screen.getByTestId('portal-state')).toHaveTextContent('employee')
    await user.click(screen.getByRole('button', { name: 'Open admin portal' }))
    expect(screen.getByTestId('portal-state')).toHaveTextContent('admin')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signed-out'))
    expect(window.localStorage.getItem('hrm.auth.session')).toBeNull()
    expect(window.localStorage.getItem('hrm.portal')).toBeNull()
    expect(authMocks.logoutAuthSession).toHaveBeenCalledWith(adminSession)
  })

  it('renders the shared admin header and sidebar with the single portal layout', async () => {
    const user = userEvent.setup()
    const setPortal = vi.fn()
    const contextValue = {
      session: adminSession,
      user: adminSession.user,
      portal: 'admin' as const,
      setPortal,
      isAuthenticated: true,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => true),
    }

    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <AuthContext.Provider value={contextValue}>
          <Header />
          <Sidebar />
          <LocationProbe />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^dashboard$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /employees/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /attendance/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /admin user/i }))
    expect(screen.getByText('Admin User')).toBeInTheDocument()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/app/dashboard')
  })

  it('loads the employee dashboard route for employee users', () => {
    const employeeSession: AuthSession = {
      ...adminSession,
      user: { ...adminSession.user, role: 'EMPLOYEE', globalRole: undefined, permissions: [] },
    }
    const contextValue = {
      session: employeeSession,
      user: employeeSession.user,
      portal: 'employee' as const,
      setPortal: vi.fn(),
      isAuthenticated: true,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => true),
    }

    window.history.pushState({}, '', '/employee/dashboard')
    render(
      <AuthContext.Provider value={contextValue}>
        <RouterApp />
      </AuthContext.Provider>,
    )

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByText(/attendance breakdown/i)).toBeInTheDocument()
  })

  it('keeps the employee dashboard on its own route instead of redirecting to the admin dashboard', () => {
    const adminEmployeeSession: AuthSession = {
      ...adminSession,
      user: {
        ...adminSession.user,
        id: 'admin-no-employee@example.test',
        email: 'admin-no-employee@example.test',
        phone: '+19999990001',
        role: 'ADMIN',
        globalRole: 'ADMIN',
        permissions: [],
      },
    }
    const contextValue = {
      session: adminEmployeeSession,
      user: adminEmployeeSession.user,
      portal: 'employee' as const,
      setPortal: vi.fn(),
      isAuthenticated: true,
      isInitializing: false,
      acceptSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      hasPermission: vi.fn(() => true),
    }

    window.history.pushState({}, '', '/employee/dashboard')
    render(
      <AuthContext.Provider value={contextValue}>
        <RouterApp />
      </AuthContext.Provider>,
    )

    expect(window.location.pathname).toBe('/employee/dashboard')
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })
})
