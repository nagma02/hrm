import { useMemo, useState } from 'react'
import { ArrowRight, Download, Search } from 'lucide-react'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '../services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'
import type { PayrollStatus } from '../types/payroll.types'
import { getPayrollSettings, isPayrollGenerationAllowed } from '../services/payroll-settings.service'

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function PayrollPage() {
  useHRMDataChange()
  const payrollSettings = getPayrollSettings()
  const records = payrollService.list()
  const [month, setMonth] = useState('October')
  const [year, setYear] = useState('2026')
  const period = `${month} ${year}`
  const [status, setStatus] = useState('All')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [page, setPage] = useState(1)
  const current = records.filter((record) => record.period === period)
  const filtered = useMemo(() => current.filter((record) => (`${record.employeeName} ${record.employeeId} ${record.department}`).toLowerCase().includes(query.toLowerCase()) && (status === 'All' || record.status === status)), [current, query, status])
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const visibleRecords = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const gross = current.reduce((sum, record) => sum + earningTotal(record), 0)
  const net = current.reduce((sum, record) => sum + netSalary(record), 0)
  const pendingCount = current.filter((record) => record.status === 'Pending Approval').length
  const approvedCount = current.filter((record) => record.status === 'Approved').length
  const publishedCount = current.filter((record) => record.status === 'Simulated').length
  const paidCount = current.filter((record) => record.status === 'Paid').length
  const update = (id: string, next: PayrollStatus) => {
    const prompt = next === 'Approved' ? 'Approve this payroll record?' : next === 'Simulated' ? 'Record a simulated payment state? No payment will be sent.' : `Move this record to ${next}?`
    if (!window.confirm(prompt)) return
    payrollService.updateStatus(id, next)
    toast.success(`Payroll ${next.toLowerCase()}.`)
  }
  const process = () => {
    if (!isPayrollGenerationAllowed()) { toast.error(`Payroll generation is available from day ${payrollSettings.workflow.windowStart} to ${payrollSettings.workflow.windowEnd} of the month.`); return }
    const count = current.filter((record) => record.status === 'Draft').length
    if (!count) { toast.info('There are no draft payroll records for this period.'); return }
    const invalid = current.filter((record) => netSalary(record) < 0)
    if (payrollSettings.workflow.blockNegative && invalid.length) { toast.error('Payroll generation blocked: negative net salary exists. Fix the deductions first.'); return }
    payrollService.process(period)
    toast.success(`${count} payroll record${count === 1 ? '' : 's'} moved to processing.`)
  }
  const processSingle = () => {
    if (!isPayrollGenerationAllowed()) { toast.error(`Payroll generation is available from day ${payrollSettings.workflow.windowStart} to ${payrollSettings.workflow.windowEnd} of the month.`); return }
    const draft = current.find((record) => selectedIds.includes(record.id) && record.status === 'Draft') ?? current.find((record) => record.status === 'Draft')
    if (!draft) { toast.info('There are no draft payroll records for this period.'); return }
    if (payrollSettings.workflow.blockNegative && netSalary(draft) < 0) { toast.error(`${draft.employeeName}'s payroll has a negative net salary and cannot be generated.`); return }
    payrollService.updateStatus(draft.id, 'Processing')
    toast.success(`${draft.employeeName}'s payroll moved to processing.`)
  }
  const validate = () => {
    const invalid = current.filter((record) => earningTotal(record) < 0 || deductionTotal(record) < 0 || netSalary(record) < 0)
    if (invalid.length && payrollSettings.workflow.blockNegative) toast.error(`${invalid.length} payroll record${invalid.length === 1 ? '' : 's'} blocked by the negative salary setting.`)
    else if (invalid.length) toast.warning(`${invalid.length} payroll record${invalid.length === 1 ? '' : 's'} need review before generation.`)
    else toast.success(`${current.length} payroll record${current.length === 1 ? '' : 's'} validated.`)
  }
  const submitForReview = (id: string) => update(id, payrollSettings.workflow.requireApproval ? 'Pending Approval' : 'Approved')
  const exportCsv = () => {
    const rows = [['Employee ID', 'Employee', 'Department', 'Period', 'Gross', 'Deductions', 'Net', 'Status'], ...filtered.map((record) => [record.employeeId, record.employeeName, record.department, record.period, earningTotal(record), deductionTotal(record), netSalary(record), record.status])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `payroll-${period.toLowerCase().replace(' ', '-')}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }
  return <PageContainer><main className="payroll-page">
    <PageHeader title="Payroll Management" subtitle="Generate, process, and manage employee payroll with dynamic approval workflow." actions={<div className="payroll-header-actions"><button className="button" onClick={() => navigateTo('/app/payroll/approvals')}>My Approvals</button><button className="button primary" onClick={validate}>Validate</button></div>} />
    <div className="payroll-controls"><label>Month<select value={month} onChange={(event) => setMonth(event.target.value)}>{months.map((item) => <option key={item}>{item}</option>)}</select></label><label>Year<select value={year} onChange={(event) => setYear(event.target.value)}>{['2026', '2025', '2024'].map((item) => <option key={item}>{item}</option>)}</select></label><span className="payroll-period-status">{period} · Monthly cycle</span></div>
    <section className="payroll-summary-grid" aria-label="Payroll overview">
      {[['Total Gross', money(gross)], ['Total Net', money(net)], ['Pending Approval', String(pendingCount)], ['Approved', String(approvedCount)], ['Published', String(publishedCount)], ['Paid', String(paidCount)]].map(([label, value]) => <article className="payroll-summary-card" key={label}><span>{label}</span><strong>{value}</strong><small>{period}</small></article>)}
    </section>
    <section className="panel payroll-records-panel"><div className="payroll-records-head"><div><span className="eyebrow">PAY RUN · {period.toUpperCase()}</span><h2>Employee payroll records</h2><p>Review salary, deductions, and payment status for each employee.</p></div></div>
      <div className="payroll-filters"><select aria-label="Filter payroll status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>{['All Status', 'Draft', 'Processing', 'Pending Approval', 'Approved', 'Simulated', 'Paid', 'Failed'].map((item) => <option key={item} value={item === 'All Status' ? 'All' : item}>{item}</option>)}</select><label className="table-search"><Search size={15}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search name / ID" /></label><button className="button" onClick={() => setQuery(query.trim())}>Search</button><span>{filtered.length} records</span></div>
      <div className="payroll-generation-actions"><button onClick={processSingle}>+ Generate Single</button><button onClick={process}>+ Generate All</button><button onClick={process}>↻ Regenerate All</button><button onClick={exportCsv}><Download size={14} /> Export Excel</button></div>
      <div className="table-scroll"><table className="hr-table payroll-records-table payroll-management-table"><thead><tr><th><input type="checkbox" aria-label="Select all payroll records" checked={filtered.length > 0 && filtered.every((record) => selectedIds.includes(record.id))} onChange={(event) => setSelectedIds(event.target.checked ? filtered.map((record) => record.id) : [])} /></th><th>#</th><th>Employee</th><th>Dept</th><th>Gross</th><th>Days</th><th>Earned</th><th>Deductions</th><th>Net</th><th>Workflow</th><th>Payment</th><th>Actions</th></tr></thead><tbody>{visibleRecords.map((record, index) => <tr key={record.id}><td><input type="checkbox" aria-label={`Select payroll for ${record.employeeName}`} checked={selectedIds.includes(record.id)} onChange={(event) => setSelectedIds((items) => event.target.checked ? [...items, record.id] : items.filter((id) => id !== record.id))} /></td><td>{(page - 1) * rowsPerPage + index + 1}</td><td><strong>{record.employeeName}</strong><small>{record.employeeId}</small></td><td>{record.department}</td><td>{money(earningTotal(record))}</td><td>{record.paidDays} / {record.workingDays}</td><td>{money(earningTotal(record))}</td><td>{money(deductionTotal(record))}</td><td className="table-primary-text">{money(netSalary(record))}</td><td><span className={`status-pill status-${record.status.toLowerCase().replaceAll(' ', '-')}`}><i />{record.status}</span></td><td>{record.status === 'Simulated' || record.status === 'Paid' ? 'Paid' : '—'}</td><td><ActionDropdown label={`Actions for ${record.employeeName}`} actions={[
        { label: 'View details', icon: <ArrowRight size={13} />, onClick: () => navigateTo(`/app/payroll/${record.id}`) },
        ...(record.status === 'Processing' ? [{ label: payrollSettings.workflow.requireApproval ? 'Submit for approval' : 'Complete without approval', onClick: () => submitForReview(record.id) }] : []),
        ...(record.status === 'Pending Approval' ? [{ label: 'Approve', onClick: () => update(record.id, 'Approved') }] : []),
        ...(record.status === 'Approved' ? [{ label: 'Record simulated payment', onClick: () => update(record.id, 'Simulated') }] : []),
      ]} /></td></tr>)}</tbody></table>{!filtered.length && <p className="payroll-empty">No payroll records found</p>}</div>
      <footer className="payroll-management-footer"><span>{filtered.length ? `Showing ${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length}` : 'No records'} <label>Rows per page: <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label></span><div><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></footer>
      <footer className="payroll-table-footer">Payroll run status: {current.length > 0 && current.every((item) => item.status === 'Simulated' || item.status === 'Paid') ? 'Simulated payment complete' : current.some((item) => item.status === 'Pending Approval') ? 'Pending approval' : current.some((item) => item.status === 'Processing') ? 'Processing' : 'In progress'} <span>Demo data and simulated status only. No bank transfer is initiated.</span></footer>
    </section>
  </main></PageContainer>
}
