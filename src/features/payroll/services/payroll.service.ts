import { payrollSeed } from '../data/payrollData'
import type { PayrollRecord, PayrollStatus } from '../types/payroll.types'
import { employeeStore } from '@/features/employees/data/employeeStore'
const key = 'hrm-payroll-records'
function readRaw(): PayrollRecord[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null') as PayrollRecord[] | null
    const records = Array.isArray(saved) ? saved : payrollSeed
    // There is no payment processor in this application; old demo "Paid" rows are simulation only.
    return records.map((row) => row.status === 'Paid' || (row.status === 'Simulated' && row.referenceId.startsWith('DEMO-TXN-'))
      ? { ...row, status: 'Simulated', paymentDate: undefined, paymentMethod: 'Not connected', maskedAccount: 'Not available', referenceId: 'SIM-DEMO', remarks: 'Demo state only; no payment transaction was verified.' }
      : row)
  } catch { return payrollSeed }
}
function read(): PayrollRecord[] {
  const employees = employeeStore.getSnapshot()
  return readRaw().flatMap((record) => {
    const employee = employees.find((item) => item.id === record.employeeId)
    return employee ? [{ ...record, employeeName: `${employee.firstName} ${employee.lastName}`, department: employee.dept, designation: employee.title }] : []
  })
}
function write(rows: PayrollRecord[]) { localStorage.setItem(key, JSON.stringify(rows)); window.dispatchEvent(new Event('hrm:data-change')); return rows }
export const payrollService = {
  list: read,
  get(id: string) { return read().find((row) => row.id === id) },
  updateStatus(id: string, status: PayrollStatus) {
    if (status === 'Paid') throw new Error('A payroll record cannot be marked paid without a verified payment result.')
    return write(read().map((row) => row.id === id ? { ...row, status, ...(status === 'Simulated' ? { simulatedAt: new Date().toISOString(), paymentDate: undefined, referenceId: `SIM-${Date.now()}`, remarks: 'Simulated locally; no payment transaction was sent.' } : {}) } : row))
  },
  process(period: string) { const rows = read(); return write(rows.map((row) => row.period === period && row.status === 'Draft' ? { ...row, status: 'Processing' } : row)) },
}
