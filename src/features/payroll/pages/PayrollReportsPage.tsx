import { Activity, Hourglass, Scale, Wallet } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { useMemo, useState } from 'react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { payrollService } from '../services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
export function PayrollReportsPage() {
  useHRMDataChange()
  const [period, setPeriod] = useState('All periods')
  const [department, setDepartment] = useState('All departments')
  const [status, setStatus] = useState('All statuses')
  const [employee, setEmployee] = useState('')
  const records = payrollService.list()
  const visible = useMemo(() => records.filter((row) => (period === 'All periods' || row.period === period) && (department === 'All departments' || row.department === department) && (status === 'All statuses' || row.status === status) && row.employeeName.toLowerCase().includes(employee.toLowerCase())), [records, period, department, status, employee])
  const gross = visible.reduce((sum, row) => sum + earningTotal(row), 0)
  const simulated = visible.filter((row) => row.status === 'Simulated').reduce((sum, row) => sum + netSalary(row), 0)
  const pending = visible.filter((row) => !['Paid', 'Simulated'].includes(row.status)).reduce((sum, row) => sum + netSalary(row), 0)
  const departments = [...new Set(records.map((row) => row.department))]
  const periods = [...new Set(records.map((row) => row.period))]
  const payrollTrend = periods.map((month) => ({
    month: month.split(' ')[0].slice(0, 3),
    amount: visible.filter((row) => row.period === month).reduce((sum, row) => sum + earningTotal(row), 0),
  }))
  const maxTrend = Math.max(1, ...payrollTrend.map((item) => item.amount))
  return <PageContainer><div className="payroll-page"><PageHeader title="Payroll reports" subtitle="Explore payroll cost, payment status, and deductions by employee and department." actions={<button className="button" onClick={() => window.print()}>Print report</button>} />
    <section className="panel payroll-report-filters"><label>Period<select value={period} onChange={(event) => setPeriod(event.target.value)}><option>All periods</option>{periods.map((value) => <option key={value}>{value}</option>)}</select></label><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{departments.map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{['Draft', 'Processing', 'Pending Approval', 'Approved', 'Simulated', 'Failed'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Employee<input value={employee} onChange={(event) => setEmployee(event.target.value)} placeholder="Search employee" /></label></section>
    <div className="payroll-summary-grid payroll-report-summary">{([['Gross payroll', money(gross), Wallet], ['Simulated', money(simulated), Activity], ['Pending / unpaid', money(pending), Hourglass], ['Deductions', money(visible.reduce((sum, row) => sum + deductionTotal(row), 0)), Scale]] as const).map(([label, value, Icon]) => <StatCard key={label} label={label} value={value} hint={`${visible.length} filtered records`} icon={<Icon size={18} />} />)}</div>
    <div className="payroll-report-grid"><section className="panel payroll-report-panel"><span className="eyebrow">DEPARTMENT COST</span><h2>Department payroll</h2>{departments.map((name) => { const amount = visible.filter((row) => row.department === name).reduce((sum, row) => sum + netSalary(row), 0); const max = Math.max(1, ...visible.map((row) => netSalary(row))); return <div className="payroll-report-bar" key={name}><div><span>{name}</span><strong>{money(amount)}</strong></div><i><b style={{ width: `${Math.min(100, (amount / max) * 28)}%` }} /></i></div> })}</section><section className="panel payroll-report-panel"><span className="eyebrow">PAYMENT TRACKING</span><h2>Simulated vs pending</h2><div className="payroll-payment-visual"><div><strong>{money(simulated)}</strong><span>Simulated amount</span></div><div><strong>{money(pending)}</strong><span>Pending amount</span></div></div><p>Amounts are calculated from visible payroll records. No bank transaction is verified.</p></section>
      <section className="panel payroll-report-panel"><span className="eyebrow">SALARY DISTRIBUTION</span><h2>Gross salary bands</h2>{['Under ₹8k', '₹8k–₹10k', 'Over ₹10k'].map((label, index) => { const count = visible.filter((row) => index === 0 ? earningTotal(row) < 8000 : index === 1 ? earningTotal(row) >= 8000 && earningTotal(row) <= 10000 : earningTotal(row) > 10000).length; return <div className="payroll-report-bar" key={label}><div><span>{label}</span><strong>{count} employees</strong></div><i><b style={{ width: `${visible.length ? count / visible.length * 100 : 0}%` }} /></i></div> })}</section>
      <section className="panel payroll-report-panel"><span className="eyebrow">PAYROLL COST TREND</span><h2>Monthly gross cost</h2><div className="payroll-trend-bars">{payrollTrend.map((item, index) => <div key={`${periods[index]}-${index}`} title={`${periods[index]}: ${money(item.amount)}`}><i style={{ height: `${(item.amount / maxTrend) * 100}%` }} /><small>{item.month}</small></div>)}</div>{!payrollTrend.length && <p>No payroll records are available for this selection.</p>}</section></div>
    <section className="panel payroll-records-panel"><div className="payroll-records-head"><div><span className="eyebrow">PAYMENT HISTORY</span><h2>Payroll detail</h2><p>Gross pay, deductions, net pay, and processing state.</p></div></div><div className="table-scroll"><Table className="hr-table payroll-records-table"><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{visible.map((row) => <TableRow key={row.id}><TableCell><strong>{row.employeeName}</strong><small className="block text-xs text-muted-foreground">{row.employeeId}</small></TableCell><TableCell>{row.department}</TableCell><TableCell>{row.period}</TableCell><TableCell>{money(earningTotal(row))}</TableCell><TableCell>{money(deductionTotal(row))}</TableCell><TableCell className="font-semibold text-foreground">{money(netSalary(row))}</TableCell><TableCell>{row.status}</TableCell></TableRow>)}</TableBody></Table>{!visible.length && <p className="payroll-empty">No payroll records match these filters.</p>}</div></section>
  </div></PageContainer>

}
