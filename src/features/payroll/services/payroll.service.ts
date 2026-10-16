import { payrollSeed } from '../data/payrollData'
import type { PayrollRecord, PayrollStatus } from '../types/payroll.types'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { getPayrollSettings } from './payroll-settings.service'
import { notificationService } from '@/features/notifications/services/notification.service'
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
    const settings = getPayrollSettings()
    const before = read().find((row) => row.id === id)
    const updated = write(read().map((row) => row.id === id ? { ...row, status, ...(status === 'Simulated' ? { simulatedAt: new Date().toISOString(), paymentDate: undefined, paymentMethod: settings.payment.method, referenceId: `SIM-${Date.now()}`, remarks: `Simulated locally using ${settings.payment.method}; no payment transaction was sent.` } : {}) } : row))
    if (before && before.status !== status && status !== 'Draft' && status !== 'Processing' && status !== 'Pending Approval') {
      const published = status === 'Approved' && settings.workflow.autoPublish
      const notificationType = published ? 'PAYSLIP_AVAILABLE' : status === 'Approved' ? 'PAYROLL_APPROVED' : 'PAYROLL_STATUS_UPDATED'
      const title = published ? 'Payslip available' : status === 'Approved' ? 'Payroll approved' : 'Payroll status updated'
      const message = published
        ? `Your ${before.period} payslip has been published.`
        : status === 'Approved'
          ? `Your ${before.period} payroll was approved.`
          : `Your ${before.period} payroll status is now ${status}. This is a demo status update; no bank payment was sent.`
      void notificationService.create({ id: `PAYROLL-STATUS-${status.toUpperCase()}-${before.id}`, recipientUserId: before.employeeId, recipientRole: 'EMPLOYEE', type: notificationType, title, message, relatedEntityType: 'PAYROLL', relatedEntityId: before.id, actionUrl: '/app/employee-payroll' })
    }
    return updated
  },
  process(period: string) {
    const rows = read()
    const changed = rows.filter((row) => row.period === period && row.status === 'Draft').length
    const updated = write(rows.map((row) => row.period === period && row.status === 'Draft' ? { ...row, status: 'Processing' } : row))
    const settings = getPayrollSettings()
    if (changed && settings.workflow.notifyApprovers) {
      void notificationService.create({ id: `PAYROLL-REVIEW-${period.replaceAll(' ', '-')}`, recipientUserId: 'ALL-ADMINS', recipientRole: 'ADMIN', type: 'PAYROLL_PROCESSED', title: 'Payroll ready for approval', message: `${changed} payroll record${changed === 1 ? '' : 's'} for ${period} moved to processing.`, relatedEntityType: 'PAYROLL_PERIOD', relatedEntityId: period, actionUrl: '/app/payroll/approvals' })
    }
    return updated
  },
}
