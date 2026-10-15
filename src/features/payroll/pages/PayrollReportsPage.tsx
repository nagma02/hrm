import { useMemo, useState } from 'react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { payrollService } from '../services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
export function PayrollReportsPage() {
  useHRMDataChange()
  const [period, setPeriod] = useState('All periods')
  const [department, setDepartment] = useState('All departments')
  const [status, setStatus] = useState('All statuses')
  const [employee, setEmployee] = useState('')
  const records = payrollService.list()
  const visible = useMemo(() => records.filter((row) => (period === 'All periods' || row.period === period) && (department === 'All departments' || row.department === department) && (status === 'All statuses' || row.status === status) && row.employeeName.toLowerCase().includes(employee.toLowerCase())), [records, period, department, status, employee])
  const gross = visible.reduce((sum, row) => sum + earningTotal(row), 0)
  const paid = visible.filter((row) => row.status === 'Paid').reduce((sum, row) => sum + netSalary(row), 0)
  const pending = visible.filter((row) => row.status !== 'Paid').reduce((sum, row) => sum + netSalary(row), 0)
  const departments = [...new Set(records.map((row) => row.department))]
  const periods = [...new Set(records.map((row) => row.period))]
  const payrollTrend = periods.map((month) => ({
    month: month.split(' ')[0].slice(0, 3),
    amount: visible.filter((row) => row.period === month).reduce((sum, row) => sum + earningTotal(row), 0),
  }))
  const maxTrend = Math.max(1, ...payrollTrend.map((item) => item.amount))
  return <PageContainer><main className="payroll-page"><PageHeader title="Payroll reports" subtitle="Explore payroll cost, payment status, and deductions by employee and department." actions={<button className="button" onClick={() => window.print()}>Print report</button>} />
    <section className="panel payroll-report-filters"><label>Period<select value={period} onChange={(event) => setPeriod(event.target.value)}><option>All periods</option>{periods.map((value) => <option key={value}>{value}</option>)}</select></label><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{departments.map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{['Draft', 'Processing', 'Pending Approval', 'Approved', 'Paid', 'Failed'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Employee<input value={employee} onChange={(event) => setEmployee(event.target.value)} placeholder="Search employee" /></label></section>
    <div className="payroll-summary-grid payroll-report-summary">{[['Gross payroll', money(gross)], ['Paid', money(paid)], ['Pending / unpaid', money(pending)], ['Deductions', money(visible.reduce((sum, row) => sum + deductionTotal(row), 0))]].map(([label, value]) => <article className="payroll-summary-card" key={label}><span>{label}</span><strong>{value}</strong><small>{visible.length} filtered records</small></article>)}</div>
    <div className="payroll-report-grid"><section className="panel payroll-report-panel"><span className="eyebrow">DEPARTMENT COST</span><h2>Department payroll</h2>{departments.map((name) => { const amount = visible.filter((row) => row.department === name).reduce((sum, row) => sum + netSalary(row), 0); const max = Math.max(1, ...visible.map((row) => netSalary(row))); return <div className="payroll-report-bar" key={name}><div><span>{name}</span><strong>{money(amount)}</strong></div><i><b style={{ width: `${Math.min(100, (amount / max) * 28)}%` }} /></i></div> })}</section><section className="panel payroll-report-panel"><span className="eyebrow">PAYMENT TRACKING</span><h2>Paid vs pending</h2><div className="payroll-payment-visual"><div><strong>{money(paid)}</strong><span>Paid amount</span></div><div><strong>{money(pending)}</strong><span>Unpaid amount</span></div></div><p>Amounts are calculated from visible payroll records. Payment data is simulated.</p></section>
      <section className="panel payroll-report-panel"><span className="eyebrow">SALARY DISTRIBUTION</span><h2>Gross salary bands</h2>{['Under $8k', '$8k–$10k', 'Over $10k'].map((label, index) => { const count = visible.filter((row) => index === 0 ? earningTotal(row) < 8000 : index === 1 ? earningTotal(row) >= 8000 && earningTotal(row) <= 10000 : earningTotal(row) > 10000).length; return <div className="payroll-report-bar" key={label}><div><span>{label}</span><strong>{count} employees</strong></div><i><b style={{ width: `${visible.length ? count / visible.length * 100 : 0}%` }} /></i></div> })}</section>
      <section className="panel payroll-report-panel"><span className="eyebrow">PAYROLL COST TREND</span><h2>Monthly gross cost</h2><div className="payroll-trend-bars">{payrollTrend.map((item, index) => <div key={`${periods[index]}-${index}`} title={`${periods[index]}: ${money(item.amount)}`}><i style={{ height: `${(item.amount / maxTrend) * 100}%` }} /><small>{item.month}</small></div>)}</div>{!payrollTrend.length && <p>No payroll records are available for this selection.</p>}</section></div>
    <section className="panel payroll-records-panel"><div className="payroll-records-head"><div><span className="eyebrow">PAYMENT HISTORY</span><h2>Payroll detail</h2><p>Gross pay, deductions, net pay, and processing state.</p></div></div><div className="table-scroll"><table className="hr-table payroll-records-table"><thead><tr><th>Employee</th><th>Department</th><th>Period</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><strong>{row.employeeName}</strong><small>{row.employeeId}</small></td><td>{row.department}</td><td>{row.period}</td><td>{money(earningTotal(row))}</td><td>{money(deductionTotal(row))}</td><td>{money(netSalary(row))}</td><td>{row.status}</td></tr>)}</tbody></table>{!visible.length && <p className="payroll-empty">No payroll records match these filters.</p>}</div></section>
  </main></PageContainer>
}
