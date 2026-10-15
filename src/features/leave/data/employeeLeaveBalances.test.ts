import { describe, expect, it } from 'vitest'
import { getEmployeeLeaveBalances } from './employeeLeaveBalances'
import type { LeaveApplication } from '@/features/leave/types/leave.types'

const request = (status: LeaveApplication['status'], balanceApplied?: boolean): LeaveApplication => ({
  id: 'LV-TEST', employeeId: 'E-1001', employeeName: 'Jane Cooper', employeeEmail: 'jane.cooper@example.com',
  leaveType: 'Annual Leave', startDate: '2026-10-10', endDate: '2026-10-14', numberOfDays: 5,
  reason: 'Family trip', status, appliedDate: '2026-10-01', balanceApplied,
})

describe('shared leave balance calculation', () => {
  it('applies approved and balance-applied requests once, ignoring pending and cancelled requests', () => {
    const balances = getEmployeeLeaveBalances('E-1001', [request('Approved', true), request('Pending'), request('Cancelled')])
    expect(balances.find((balance) => balance.leaveType === 'Paid Leave')?.used).toBe(13)
    expect(balances.find((balance) => balance.leaveType === 'Casual Leave')?.used).toBe(4)
  })

  it('provides policy balances for employees without seeded balance records', () => {
    const balances = getEmployeeLeaveBalances('E-NEW', [])
    expect(balances.map((balance) => balance.leaveType)).toEqual(['Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'])
  })
})
