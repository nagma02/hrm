import { leaveBalances, type LeaveBalance } from '@/features/leave/data/leaveBalances'
import type { LeaveApplication } from '@/features/leave/types/leave.types'

function balanceType(leaveType: string) {
  if (leaveType === 'Earned Leave' || leaveType === 'Annual Leave') return 'Paid Leave'
  return leaveType
}

export function getEmployeeLeaveBalances(employeeId: string, requests: LeaveApplication[], employeeEmail?: string, employeePhone?: string): LeaveBalance[] {
  const base = leaveBalances.filter((balance) => balance.employeeId === employeeId)
  const employeeName = base[0]?.employee ?? requests.find((request) => request.employeeId === employeeId || Boolean(employeeEmail && request.employeeEmail.toLowerCase() === employeeEmail.toLowerCase()))?.employeeName ?? 'Employee'
  const approvedDays = new Map<string, number>()
  requests.forEach((request) => {
    const belongsToEmployee = request.employeeId === employeeId
      || Boolean(employeeEmail && request.employeeEmail.toLowerCase() === employeeEmail.toLowerCase())
      || Boolean(employeePhone && request.employeePhone === employeePhone)
    if (!belongsToEmployee || request.status !== 'Approved' || request.balanceApplied !== true) return
    const key = balanceType(request.leaveType)
    approvedDays.set(key, (approvedDays.get(key) ?? 0) + request.numberOfDays)
  })
  const defaults: Record<string, { annualQuota: number; paid: boolean }> = {
    'Casual Leave': { annualQuota: 12, paid: true },
    'Sick Leave': { annualQuota: 8, paid: true },
    'Paid Leave': { annualQuota: 18, paid: true },
    'Unpaid Leave': { annualQuota: 0, paid: false },
  }
  const updated = Object.entries(defaults).map(([leaveType, policy]) => {
    const existing = base.find((balance) => balance.leaveType === leaveType)
    const additionalUsed = approvedDays.get(leaveType) ?? 0
    approvedDays.delete(leaveType)
    return existing
      ? { ...existing, used: existing.used + additionalUsed }
      : { employeeId, employee: employeeName, leaveType, annualQuota: policy.annualQuota, used: additionalUsed, paid: policy.paid, carryForward: 0, accrued: policy.annualQuota }
  })
  approvedDays.forEach((used, leaveType) => {
    const policy = defaults[leaveType] ?? { annualQuota: 0, paid: false }
    updated.push({ employeeId, employee: employeeName, leaveType, annualQuota: policy.annualQuota, used, paid: policy.paid, carryForward: 0, accrued: policy.annualQuota })
  })
  return updated
}
