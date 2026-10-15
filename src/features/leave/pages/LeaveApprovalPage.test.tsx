import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LeaveApprovalPage } from './LeaveApprovalPage'

const mockRows = vi.hoisted(() => [{
  id: 'LV-1001',
  employeeId: 'E-1001',
  employeeName: 'Alice Johnson',
  employeeEmail: 'alice@example.com',
  leaveType: 'Annual Leave',
  startDate: '2026-11-02',
  endDate: '2026-11-04',
  numberOfDays: 3,
  reason: 'Family trip',
  status: 'Pending',
  appliedDate: '2026-10-28',
}])

vi.mock('@/app/providers/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+919876543210',
      role: 'SUPER_ADMIN',
      globalRole: 'SUPER_ADMIN',
    },
  }),
}))

vi.mock('@/hooks/useHRMDataChange', () => ({
  useHRMDataChange: vi.fn(),
}))

vi.mock('../hooks/useLeaveApplications', () => ({
  useLeaveApplications: () => mockRows,
}))

vi.mock('../services/leave.service', () => ({
  leaveService: {
    updateStatus: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(() => mockRows),
    refresh: vi.fn().mockResolvedValue(mockRows),
  },
  formatLeaveDate: (value: string) => value,
}))

describe('LeaveApprovalPage', () => {
  it('removes the top summary cards and keeps the approval queue intact', () => {
    render(
      <MemoryRouter>
        <LeaveApprovalPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Leave management')).not.toBeInTheDocument()
    expect(screen.queryByText('Request distribution')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /leave request summary/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Total requests')).not.toBeInTheDocument()
    expect(screen.queryByText('Pending review')).not.toBeInTheDocument()
    expect(screen.getByText('Leave approvals')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Approve/i }).length).toBeGreaterThan(0)
  })
})
