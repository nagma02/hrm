import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PaymentsPage } from './PaymentsPage'

const mocks = vi.hoisted(() => ({ employeeId: 'E-1001' }))

vi.mock('@/hooks/useHRMDataChange', () => ({ useHRMDataChange: vi.fn() }))
vi.mock('@/employee/hooks/useEmployeeRecord', () => ({
  useEmployeeRecord: () => ({ employeeId: mocks.employeeId, employee: undefined, user: null }),
}))
vi.mock('@/features/payroll/services/payroll.service', () => {
  const row = (id: string, employeeId: string, employeeName: string) => ({
    id, employeeId, employeeName, department: 'Engineering', period: 'October 2026', status: 'Approved',
    basic: 1000, hra: 0, specialAllowance: 0, otherAllowances: 0, bonus: 0, overtime: 0,
    pf: 0, esi: 0, professionalTax: 0, tds: 0, otherDeductions: 0, lossOfPay: 0,
  })
  return { payrollService: { list: () => [row('P-1', 'E-1001', 'Jane Cooper'), row('P-2', 'E-1002', 'John Doe')] } }
})

const tableRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('PaymentsPage scoping', () => {
  afterEach(() => {
    cleanup()
    mocks.employeeId = 'E-1001'
  })

  it('shows every employee to admins', () => {
    render(<PaymentsPage />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(tableRows()).toHaveLength(2)
  })

  it("limits the employee portal to the signed-in employee's own payroll", () => {
    render(<PaymentsPage scope="employee" />)
    expect(screen.getByRole('heading', { name: 'My payments' })).toBeInTheDocument()
    expect(screen.getByText('Jane Cooper')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('shows no payroll when the employee record cannot be resolved', () => {
    mocks.employeeId = ''
    render(<PaymentsPage scope="employee" />)
    expect(screen.queryByText('Jane Cooper')).not.toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
})
