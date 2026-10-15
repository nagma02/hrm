import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import RecentEmployeesTable from './RecentEmployeesTable'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { employees } from '@/features/employees/data/employeesData'

afterEach(() => {
  cleanup()
  employeeStore.save(employees)
  window.history.replaceState({}, '', '/')
})

describe('Dashboard recent employees', () => {
  it('updates from the shared employee store and opens the employee details route', async () => {
    render(<RecentEmployeesTable />)
    act(() => employeeStore.create({
      id: 'E-NEW-250', firstName: 'Nagma', lastName: 'Siddiqui', email: 'nagma@example.com', phone: '+1 555 0109',
      dept: 'Engineering', title: 'Software Engineer', joinDate: '2026-10-08', location: 'Remote', status: 'Active',
    }))

    const employeeLink = await screen.findByRole('button', { name: 'View Nagma Siddiqui' })
    await userEvent.click(employeeLink)
    expect(window.location.pathname).toBe('/app/employees/E-NEW-250')
    expect(screen.getByText('Nagma Siddiqui')).toBeInTheDocument()
  })
})
