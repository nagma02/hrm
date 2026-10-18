import { useState } from 'react'
import { Download, Printer } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '../services/payroll.service'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'
import type { PayrollStatus } from '../types/payroll.types'
import { getEmployeeLeaveBalances } from '@/features/leave/data/employeeLeaveBalances'
import { useLeaveApplications } from '@/features/leave/hooks/useLeaveApplications'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { getPayrollSettings } from '../services/payroll-settings.service'

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
const earnings = (record: NonNullable<ReturnType<typeof payrollService.get>>) => [['Basic salary', record.basic], ['HRA', record.hra], ['Special allowance', record.specialAllowance], ['Other allowances', record.otherAllowances], ['Bonus', record.bonus], ['Overtime', record.overtime]] as const
const deductions = (record: NonNullable<ReturnType<typeof payrollService.get>>) => [['PF', record.pf], ['ESI', record.esi], ['Professional tax', record.professionalTax], ['TDS', record.tds], ['Other deductions', record.otherDeductions], ['Loss of pay', record.lossOfPay]] as const
export function PayrollDetailPage() {
  const { id = '' } = useParams()
  const leaveRequests = useLeaveApplications()
  const employees = useEmployees()
  const companySettings = getPayrollSettings()
  const [record, setRecord] = useState(() => payrollService.get(id))
  if (!record) return <PageContainer><PageHeader title="Payroll record not found" subtitle="This record may have been removed." /><button className="button" onClick={() => navigateTo('/app/payroll')}>Back to payroll</button></PageContainer>
  const transition = (status: PayrollStatus) => {
    const prompt = status === 'Approved' ? 'Approve this payroll record?' : 'Record a simulated payment state? No payment will be sent.'
    if (!window.confirm(prompt)) return
    const updated = payrollService.updateStatus(record.id, status).find((row) => row.id === record.id)
    if (updated) setRecord(updated)
    toast.success(`Payroll ${status.toLowerCase()}.`)
  }
  const employee = employees.find((item) => item.id === record.employeeId)
  const unpaidLeave = getEmployeeLeaveBalances(record.employeeId, leaveRequests, employee?.email, employee?.phone).find((balance) => !balance.paid && balance.used > 0)
  return <PageContainer><div className="payroll-page payroll-detail-page">
    <PageHeader title={`${record.employeeName} · Payroll`} subtitle={`${record.employeeId} · ${record.period}`} actions={<div className="payroll-header-actions"><button className="button" onClick={() => navigateTo('/app/payroll')}>Back to payroll</button>{record.status === 'Pending Approval' && <button className="button primary" onClick={() => transition('Approved')}>Approve payroll</button>}{record.status === 'Approved' && <button className="button primary" onClick={() => transition('Simulated')}>Record simulated payment</button>}</div>} />
    <div className="payroll-detail-grid"><section className="panel payroll-info-panel"><span className="eyebrow">EMPLOYEE INFORMATION</span><h2>{record.employeeName}</h2><dl><div><dt>Employee ID</dt><dd>{record.employeeId}</dd></div><div><dt>Department</dt><dd>{record.department}</dd></div><div><dt>Designation</dt><dd>{record.designation}</dd></div><div><dt>Pay period</dt><dd>{record.period}</dd></div><div><dt>Payroll status</dt><dd><span className={`status-pill status-${record.status.toLowerCase().replaceAll(' ', '-')}`}><i />{record.status}</span></dd></div></dl></section>
      <section className="panel payroll-info-panel"><span className="eyebrow">ATTENDANCE & LEAVE IMPACT</span><h2>Payable days</h2><dl><div><dt>Working days</dt><dd>{record.workingDays}</dd></div><div><dt>Paid days</dt><dd>{record.paidDays}</dd></div><div><dt>Unpaid days</dt><dd>{record.unpaidDays}{unpaidLeave?.used ? ` · ${unpaidLeave.leaveType}` : ''}</dd></div><div><dt>Overtime</dt><dd>{record.overtimeHours} hours</dd></div><div><dt>Loss of pay</dt><dd>{money(record.lossOfPay)}</dd></div></dl><p className="payroll-demo-note">Attendance and leave figures are demo payroll inputs.</p></section>
    </div>
    <section className="panel payroll-breakdown-panel"><div className="payroll-company">{companySettings.companyLogo && <img src={companySettings.companyLogo} alt={`${companySettings.companyName} logo`} onError={(event) => { event.currentTarget.hidden = true }} />}<strong>{companySettings.companyName}</strong><span>{companySettings.address} · {companySettings.email} · {companySettings.phone}</span></div><div className="payroll-section-title"><div><span className="eyebrow">SALARY BREAKDOWN</span><h2>Earnings & deductions</h2></div><strong className="payroll-net-total">Net salary {money(netSalary(record))}</strong></div><div className="payroll-breakdown-grid"><div><h3>Earnings</h3>{earnings(record).map(([label, value]) => <div className="payroll-money-row" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}<div className="payroll-money-row payroll-money-total"><span>Gross salary</span><strong>{money(earningTotal(record))}</strong></div></div><div><h3>Deductions</h3>{deductions(record).map(([label, value]) => <div className="payroll-money-row" key={label}><span>{label}</span><strong>{money(value)}</strong></div>)}<div className="payroll-money-row payroll-money-total"><span>Total deductions</span><strong>{money(deductionTotal(record))}</strong></div></div></div></section>
    <div className="payroll-detail-grid"><section className="panel payroll-info-panel"><span className="eyebrow">PAYMENT INFORMATION</span><h2>Payment details</h2><dl><div><dt>Status</dt><dd>{record.status}</dd></div><div><dt>Verified payment date</dt><dd>{record.paymentDate ?? 'No verified payment'}</dd></div>{record.status === 'Simulated' && <div><dt>Simulation recorded</dt><dd>{record.simulatedAt ? new Date(record.simulatedAt).toLocaleString() : 'Demo seed record'}</dd></div>}<div><dt>Payment method</dt><dd>{record.status === 'Simulated' ? 'Not connected' : record.paymentMethod}</dd></div><div><dt>Bank account</dt><dd>{record.status === 'Simulated' ? 'Not available' : record.maskedAccount}</dd></div>{record.status !== 'Simulated' && <div><dt>Reference ID</dt><dd>{record.referenceId}</dd></div>}<div><dt>Remarks</dt><dd>{record.remarks}</dd></div></dl></section><section className="panel payroll-info-panel"><span className="eyebrow">PAYROLL TIMELINE</span><h2>Pay run activity</h2><ol className="payroll-timeline"><li><strong>Payroll calculated</strong><small>{record.period} · Demo calculation</small></li><li><strong>{record.status === 'Draft' ? 'Awaiting processing' : 'Submitted for review'}</strong><small>Based on attendance and leave inputs</small></li><li><strong>{record.status === 'Simulated' ? 'Simulation recorded' : record.status === 'Paid' ? 'Verified payment recorded' : 'Payment pending'}</strong><small>{record.simulatedAt ? new Date(record.simulatedAt).toLocaleString() : record.paymentDate ?? 'No payment has been recorded'}</small></li></ol></section></div>
    <section className="payroll-detail-actions"><span>Payslip contains demo compensation data. Account details are masked.</span><button className="button" onClick={() => window.print()}><Printer size={15}/> Print payslip</button><button className="button" onClick={() => { window.print(); toast.info('Choose Save as PDF in the print dialog to download a PDF.') }}><Download size={15}/> Download payslip</button></section>
  </div></PageContainer>
}
