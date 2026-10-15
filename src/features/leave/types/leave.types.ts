export const leaveTypes = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Annual Leave',
  'Emergency Leave',
  'Unpaid Leave',
  'Maternity / Paternity Leave',
] as const

export type LeaveType = (typeof leaveTypes)[number]
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type LeaveApplication = {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeePhone?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  numberOfDays: number
  reason: string
  status: LeaveStatus
  appliedDate: string
  balanceApplied?: boolean
  decisionBy?: string
  decisionAt?: string
  decisionComment?: string
  rejectionReason?: string
  attachmentName?: string
  /** Preserves the date label from records created by the earlier generic leave page. */
  legacyPeriod?: string
}

export type LeaveApplicationInput = Omit<LeaveApplication, 'id' | 'status' | 'appliedDate' | 'legacyPeriod' | 'decisionBy' | 'decisionAt' | 'decisionComment' | 'rejectionReason'> & {
  submittedForEmployee?: boolean
}
