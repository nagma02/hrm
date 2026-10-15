export type PayrollStatus = 'Draft' | 'Processing' | 'Pending Approval' | 'Approved' | 'Simulated' | 'Paid' | 'Failed'
export type PayrollRecord = {
  id: string; employeeId: string; employeeName: string; department: string; designation: string
  period: string; status: PayrollStatus; basic: number; hra: number; specialAllowance: number
  otherAllowances: number; bonus: number; overtime: number; pf: number; esi: number
  professionalTax: number; tds: number; otherDeductions: number; lossOfPay: number
  paymentDate?: string; simulatedAt?: string; paymentMethod: string; maskedAccount: string; referenceId: string; remarks: string
  workingDays: number; paidDays: number; unpaidDays: number; overtimeHours: number
}
