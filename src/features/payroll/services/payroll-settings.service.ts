const storageKey = 'hrm-payroll-configuration'

export const defaultPayrollSettings = {
  companyName: 'Advik Estate Services OPC PVT. LTD.', companyLogo: '', address: 'Office No. 1414, 14th Floor, Skyline Plaza 3, International Business Bay 1, Sushant Golf City, Lucknow 226030', email: 'hr@advikrealtor.com', phone: '07518802651',
  components: [{ name: 'Basic', code: 'BASIC', type: 'earning', calc: 'percentage', value: '50%', basedOn: 'gross' }, { name: 'House Rent Allowance', code: 'HRA', type: 'earning', calc: 'percentage', value: '40%', basedOn: 'basic' }, { name: 'Conveyance Allowance', code: 'CA', type: 'earning', calc: 'fixed', value: '₹1600', basedOn: 'basic' }, { name: 'Medical Allowance', code: 'MA', type: 'earning', calc: 'fixed', value: '₹1250', basedOn: 'basic' }],
  deductions: [{ name: 'Performance Deduction', code: 'PD', calc: 'Percentage', base: 'Gross', value: '30%', recurring: 'One_time', active: true }, { name: 'TDS', code: 'TDS', calc: 'Fixed', base: 'Gross', value: '₹5000', recurring: 'One_time', active: true }, { name: 'Salary Advance', code: 'SA', calc: 'Manual', base: 'Manual', value: '—', recurring: 'One_time', active: true }],
  workflow: { generationWindow: false, windowStart: '2', windowEnd: '5', cutoffDay: '1', lockDay: '10', paymentDay: '8', requireApproval: true, allowRegeneration: true, superAdminRegeneration: false, superAdminBypass: true, autoPayslip: true, autoUpload: true, autoPublish: false, unlockAfterApproval: true, notifyApprovers: true, notifyEmployee: true, emailOnApproval: true, validateBank: true, validatePan: false, validateUan: false, blockNegative: false },
  payment: { mode: 'Bulk Manual', bulkEnabled: true, method: 'NEFT', defaultStatus: 'Processing', allowOverride: true, confirmBeforeBulk: true, auditLogs: true, scheduled: false, date: '28', time: '09:00', delay: '0', delayUnit: 'Days' },
  incentive: { enabled: true, mergeMode: 'Automatic', mergeTiming: 'Immediately after Payment Processed', pending: true, processing: true, processed: true, rejected: false, includePrevious: false, preventDuplicate: true, recalculate: true, logMerge: true, notifyEmployee: true, notifyFinance: true, notifyAdmin: true },
}

export type PayrollSettings = typeof defaultPayrollSettings

export function getPayrollSettings(): PayrollSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Partial<PayrollSettings> | null
    if (!saved) return defaultPayrollSettings
    const payment = { ...defaultPayrollSettings.payment, ...saved.payment }
    // A locally selected status cannot verify that a bank transfer settled.
    if (payment.defaultStatus === 'Paid') payment.defaultStatus = 'Processing'
    return { ...defaultPayrollSettings, ...saved, workflow: { ...defaultPayrollSettings.workflow, ...saved.workflow }, payment, incentive: { ...defaultPayrollSettings.incentive, ...saved.incentive }, components: saved.components ?? defaultPayrollSettings.components, deductions: saved.deductions ?? defaultPayrollSettings.deductions }
  } catch { return defaultPayrollSettings }
}

export function savePayrollSettings(settings: PayrollSettings) {
  localStorage.setItem(storageKey, JSON.stringify(settings))
  window.dispatchEvent(new Event('hrm:data-change'))
}

export function isPayrollGenerationAllowed(now = new Date()): boolean {
  const { workflow } = getPayrollSettings()
  if (!workflow.generationWindow) return true
  const day = now.getDate()
  const start = Number(workflow.windowStart)
  const end = Number(workflow.windowEnd)
  return Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end <= 31 && start <= end && day >= start && day <= end
}
