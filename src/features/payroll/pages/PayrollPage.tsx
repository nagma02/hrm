import { useMemo, useState } from 'react'
import { ArrowRight, ClipboardCheck, Download, Search } from 'lucide-react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '../services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'
import type { PayrollStatus } from '../types/payroll.types'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function PayrollPage() {
  useHRMDataChange()
  const records = payrollService.list()
  const [month, setMonth] = useState('October')
  const [year, setYear] = useState('2026')
  const period = `${month} ${year}`
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const current = records.filter((record) => record.period === period)
  const filtered = useMemo(() => current.filter((record) => (`${record.employeeName} ${record.employeeId} ${record.department}`).toLowerCase().includes(query.toLowerCase()) && (status === 'All' || record.status === status)), [current, query, status])
  const gross = current.reduce((sum, record) => sum + earningTotal(record), 0)
  const net = current.reduce((sum, record) => sum + netSalary(record), 0)
  const simulated = current.filter((record) => record.status === 'Simulated').reduce((sum, record) => sum + netSalary(record), 0)
  const pending = current.filter((record) => !['Paid', 'Simulated', 'Failed'].includes(record.status)).reduce((sum, record) => sum + netSalary(record), 0)
  const update = (id: string, next: PayrollStatus) => {
    const prompt = next === 'Approved' ? 'Approve this payroll record?' : next === 'Simulated' ? 'Record a simulated payment state? No payment will be sent.' : `Move this record to ${next}?`
    if (!window.confirm(prompt)) return
    payrollService.updateStatus(id, next)
    toast.success(`Payroll ${next.toLowerCase()}.`)
  }
  const process = () => {
    const count = current.filter((record) => record.status === 'Draft').length
    if (!count) { toast.info('There are no draft payroll records for this period.'); return }
    payrollService.process(period)
    toast.success(`${count} payroll record${count === 1 ? '' : 's'} moved to processing.`)
  }
  const exportCsv = () => {
    const rows = [['Employee ID', 'Employee', 'Department', 'Period', 'Gross', 'Deductions', 'Net', 'Status'], ...filtered.map((record) => [record.employeeId, record.employeeName, record.department, record.period, earningTotal(record), deductionTotal(record), netSalary(record), record.status])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `payroll-${period.toLowerCase().replace(' ', '-')}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }
  return <PageContainer><main className="payroll-page">
    <PageHeader title="Payroll" subtitle="Review payroll calculations, approvals, and payment progress." actions={<div className="payroll-header-actions"><button className="button" onClick={() => navigateTo('/app/payroll/reports')}>Payroll reports</button><button className="button primary" onClick={process}><ClipboardCheck size={15} /> Process draft payroll</button></div>} />
    <div className="payroll-controls"><label>Month<select value={month} onChange={(event) => setMonth(event.target.value)}>{months.map((item) => <option key={item}>{item}</option>)}</select></label><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}>{['2026', '2025', '2024'].map((item) => <option key={item}>{item}</option>)}</select></label><span className="payroll-period-status">{period} · Monthly cycle</span></div>
    <section className="payroll-summary-grid" aria-label="Payroll overview">
      {[['Gross payroll', money(gross)], ['Net payroll', money(net)], ['Simulated payment state', money(simulated)], ['Pending amount', money(pending)], ['Approved or simulated', `${current.filter((item) => ['Simulated', 'Paid', 'Approved'].includes(item.status)).length} / ${current.length}`], ['Total deductions', money(gross - net)]].map(([label, value]) => <article className="payroll-summary-card" key={label}><span>{label}</span><strong>{value}</strong><small>{label === 'Pending amount' ? 'Awaiting payment' : label === 'Approved or simulated' ? 'Demo workflow progress' : period}</small></article>)}
    </section>
    <section className="panel payroll-records-panel"><div className="payroll-records-head"><div><span className="eyebrow">PAY RUN · {period.toUpperCase()}</span><h2>Employee payroll records</h2><p>Review salary, deductions, and payment status for each employee.</p></div><button className="icon-button" onClick={exportCsv} aria-label="Export filtered payroll records"><Download size={16} /></button></div>
      <div className="payroll-filters"><label className="table-search"><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee or department" /></label><select aria-label="Filter payroll status" value={status} onChange={(event) => setStatus(event.target.value)}>{['All', 'Draft', 'Processing', 'Pending Approval', 'Approved', 'Simulated', 'Paid', 'Failed'].map((item) => <option key={item}>{item}</option>)}</select><span>{filtered.length} records</span></div>
      <div className="table-scroll"><table className="hr-table payroll-records-table"><thead><tr><th>Employee</th><th>Department / designation</th><th>Gross</th><th>Deductions</th><th>Net salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((record) => <tr key={record.id}><td><strong>{record.employeeName}</strong><small>{record.employeeId}</small></td><td>{record.department}<small>{record.designation}</small></td><td>{money(earningTotal(record))}</td><td>{money(deductionTotal(record))}</td><td className="table-primary-text">{money(netSalary(record))}</td><td><span className={`status-pill status-${record.status.toLowerCase().replaceAll(' ', '-')}`}><i />{record.status}</span></td><td><div className="payroll-row-actions"><button className="text-action" onClick={() => navigateTo(`/app/payroll/${record.id}`)}>Details <ArrowRight size={13}/></button>{record.status === 'Processing' && <button className="text-action" onClick={() => update(record.id, 'Pending Approval')}>Submit</button>}{record.status === 'Pending Approval' && <button className="text-action" onClick={() => update(record.id, 'Approved')}>Approve</button>}{record.status === 'Approved' && <button className="text-action" onClick={() => update(record.id, 'Simulated')}>Record simulated payment</button>}</div></td></tr>)}</tbody></table>{!filtered.length && <p className="payroll-empty">No payroll records match these filters.</p>}</div>
      <footer className="payroll-table-footer">Payroll run status: {current.length > 0 && current.every((item) => item.status === 'Simulated' || item.status === 'Paid') ? 'Simulated payment complete' : current.some((item) => item.status === 'Pending Approval') ? 'Pending approval' : current.some((item) => item.status === 'Processing') ? 'Processing' : 'In progress'} <span>Demo data and simulated status only. No bank transfer is initiated.</span></footer>
    </section>
  </main></PageContainer>
}
