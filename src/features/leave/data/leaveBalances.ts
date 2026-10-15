export type LeaveBalance = { employeeId: string; employee: string; leaveType: string; annualQuota: number; used: number; paid: boolean; carryForward: number; accrued: number }
export const leaveBalances: LeaveBalance[] = [
  { employeeId: 'E-1001', employee: 'Jane Cooper', leaveType: 'Casual Leave', annualQuota: 12, used: 4, paid: true, carryForward: 0, accrued: 8 },
  { employeeId: 'E-1001', employee: 'Jane Cooper', leaveType: 'Sick Leave', annualQuota: 8, used: 2, paid: true, carryForward: 0, accrued: 6 },
  { employeeId: 'E-1001', employee: 'Jane Cooper', leaveType: 'Paid Leave', annualQuota: 18, used: 8, paid: true, carryForward: 0, accrued: 10 },
  { employeeId: 'E-1001', employee: 'Jane Cooper', leaveType: 'Unpaid Leave', annualQuota: 0, used: 0, paid: false, carryForward: 0, accrued: 0 },
  { employeeId: 'E-1003', employee: 'Aisha Khan', leaveType: 'Sick Leave', annualQuota: 10, used: 3, paid: true, carryForward: 0, accrued: 7 },
  { employeeId: 'E-1004', employee: 'Michael Smith', leaveType: 'Casual Leave', annualQuota: 12, used: 5, paid: true, carryForward: 1, accrued: 8 },
  { employeeId: 'E-1004', employee: 'Michael Smith', leaveType: 'Unpaid Leave', annualQuota: 0, used: 1, paid: false, carryForward: 0, accrued: 0 },
]
