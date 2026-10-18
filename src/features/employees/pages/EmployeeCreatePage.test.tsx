import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EmployeeCreatePage from './EmployeeCreatePage'
import EmployeesPage from './EmployeesPage'
import { employeeStore } from '../data/employeeStore'
import { employees } from '../data/employeesData'
import { AuthProvider } from '@/app/providers/auth-provider'
import { AuthContext, type AuthContextValue } from '@/app/providers/auth-context'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'
import type { User } from '@/types/auth'

afterEach(() => {
  cleanup()
  employeeStore.save(employees)
  window.history.replaceState({}, '', '/')
})

describe('Add Employee flow', () => {
  it('adds a validated employee to the shared store and navigates to Employees', async () => {
    window.history.replaceState({}, '', '/app/employees/create')
    const user = userEvent.setup()
    render(<AuthProvider><EmployeeCreatePage /></AuthProvider>)

    await user.type(screen.getByLabelText('First name'), 'Nagma')
    await user.type(screen.getByLabelText('Last name'), 'Siddiqui')
    await user.type(screen.getByLabelText('Work email'), 'nagma@example.com')
    await user.type(screen.getByLabelText('Phone number'), '+1 555 0109')
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    await user.type(screen.getByLabelText('Employee ID'), 'E-NEW-249')
    await user.type(screen.getByLabelText('Department'), 'Engineering')
    await user.type(screen.getByLabelText('Designation'), 'Software Engineer')
    await user.type(screen.getByLabelText('Joining date'), '2026-10-08')
    await user.type(screen.getByLabelText('Work location'), 'Remote')
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(employeeStore.getById('E-NEW-249')).toMatchObject({
      firstName: 'Nagma', lastName: 'Siddiqui', dept: 'Engineering', title: 'Software Engineer', status: 'Active', joinDate: '2026-10-08',
    }))
    expect(employeeStore.getById('E-NEW-249')?.createdAt).toBeTruthy()
    expect(window.location.pathname).toBe('/app/employees')

    cleanup()
    render(<AuthProvider><EmployeesPage /></AuthProvider>)
    expect(screen.getByText('Nagma Siddiqui')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search employees, id, email...'), 'E-NEW-249')
    expect(screen.getByText('Nagma Siddiqui')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Actions for Nagma Siddiqui' }))
    await user.click(screen.getByRole('menuitem', { name: 'View details' }))
    expect(window.location.pathname).toBe('/app/employees/E-NEW-249')
  })

  it('prefills and creates an employee profile linked to the authenticated account', async () => {
    const currentUser: User = {
      id: 'account-100', name: 'Alex Morgan', email: 'alex@example.test', phone: '+919876543210',
      role: 'SUPER_ADMIN', permissions: ['employee.manage'],
    }
    const context: AuthContextValue = {
      portal: 'admin', setPortal: vi.fn(), session: { accessToken: 'session-token', user: currentUser },
      user: currentUser, isAuthenticated: true, isInitializing: false, acceptSession: vi.fn(),
      updateUser: vi.fn(), signOut: vi.fn(), hasPermission: vi.fn(() => true),
    }
    window.history.replaceState({}, '', '/app/employees/create?linkCurrentUser=true')
    const user = userEvent.setup()
    render(<AuthContext.Provider value={context}><EmployeeCreatePage /></AuthContext.Provider>)

    expect(screen.getByLabelText('First name')).toHaveValue('Alex')
    expect(screen.getByLabelText('Last name')).toHaveValue('Morgan')
    expect(screen.getByLabelText('Work email')).toHaveValue(currentUser.email)
    expect(screen.getByLabelText('Phone number')).toHaveValue(currentUser.phone)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(screen.getByLabelText('Employee ID'), 'E-LINK-100')
    await user.type(screen.getByLabelText('Department'), 'People')
    await user.type(screen.getByLabelText('Designation'), 'HR Administrator')
    await user.type(screen.getByLabelText('Joining date'), '2025-01-01')
    await user.type(screen.getByLabelText('Work location'), 'Remote')
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(employeeStore.getById('E-LINK-100')).toMatchObject({
      email: currentUser.email, phone: currentUser.phone, firstName: 'Alex', lastName: 'Morgan',
    }))
    expect(findCurrentEmployee(employeeStore.getSnapshot(), currentUser)?.id).toBe('E-LINK-100')
    expect(window.location.pathname).toBe('/employee/dashboard')
    expect(context.user).toBe(currentUser)
    expect(context.session?.user).toBe(currentUser)
  })
})
