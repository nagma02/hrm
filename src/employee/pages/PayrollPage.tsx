import { useMemo, useState } from 'react'
import { ArrowDownToLine, BadgeDollarSign, CalendarDays, Check, FileText, Wallet } from 'lucide-react'
import { earningTotal, deductionTotal, netSalary } from '@/features/payroll/data/payrollData'
import { payrollService } from '@/features/payroll/services/payroll.service'
import type { PayrollRecord } from '@/features/payroll/types/payroll.types'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

type PayrollTab = 'Monthly Payslips' | 'Annual Tax Summary'
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
const processed = (record: PayrollRecord) => ['Approved', 'Paid', 'Simulated'].includes(record.status)

export default function PayrollPage() {
  const { employee } = useEmployeeRecord()
  const revision = useHRMDataChange()
  const [tab, setTab] = useState<PayrollTab>('Monthly Payslips')
  const [selected, setSelected] = useState<PayrollRecord | null>(null)
  const rows = useMemo(() => employee ? payrollService.list().filter((row) => row.employeeId === employee.id && processed(row)).sort((left, right) => right.period.localeCompare(left.period)) : [], [employee, revision])
  const latest = rows[0]
  const gross = latest ? earningTotal(latest) : 0
  const deductions = latest ? deductionTotal(latest) : 0
  const net = latest ? netSalary(latest) : 0
  const years = [...new Set(rows.map((row) => row.period.match(/\d{4}/)?.[0]).filter((value): value is string => Boolean(value)))].sort((a, b) => b.localeCompare(a))
  const openPayslip = (record: PayrollRecord) => setSelected(record)
  const printPayslip = () => window.print()
  const currentYear = new Date().getFullYear().toString()
  const annual = rows.filter((row) => row.period.includes(currentYear))
  const annualGross = annual.reduce((sum, row) => sum + earningTotal(row), 0)
  const annualTax = annual.reduce((sum, row) => sum + row.tds + row.professionalTax, 0)

  return <PageContainer>
    <PageHeader title="My payroll" subtitle="Processed payslips and salary breakdown." actions={latest ? <button className="button primary" type="button" onClick={() => openPayslip(latest)}><ArrowDownToLine size={15} /> Download payslip</button> : undefined} />
    <section className="employee-payroll-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">{[
      ['BASIC SALARY', latest?.basic ?? 0], ['ALLOWANCES', latest ? latest.hra + latest.specialAllowance + latest.otherAllowances + latest.bonus + latest.overtime : 0], ['GROSS SALARY', gross], ['DEDUCTIONS', deductions], ['NET PAY', net],
    ].map(([label, value]) => <article className="card employee-payroll-metric" key={label}><span className="eyebrow">{label}</span><strong>{money(Number(value))}</strong><small>{latest?.period ?? 'No processed payroll yet'}</small></article>)}</section>
    <section className="employee-payroll-summary-grid"><article className="card employee-payroll-summary"><span className="employee-card-icon"><Wallet size={17} /></span><div><small>Payment status</small><strong>{latest?.status ?? 'Not processed'}</strong><span>{latest?.paymentDate ? `Payment date ${latest.paymentDate}` : latest?.remarks ?? 'Payroll status will appear when HR processes it.'}</span></div></article><article className="card employee-payroll-summary"><span className="employee-card-icon"><BadgeDollarSign size={17} /></span><div><small>Year to date earnings · {currentYear}</small><strong>{money(annualGross)}</strong><span>Tax and professional tax: {money(annualTax)}</span></div></article><article className="card employee-payroll-summary"><span className="employee-card-icon"><ShieldMini /></span><div><small>Bank account</small><strong>{latest?.maskedAccount ?? 'Not available'}</strong><span>{latest?.paymentMethod ?? 'Salary account masked for privacy'}</span></div></article></section>
    <section className="card employee-data-card"><header className="employee-data-toolbar"><div><span className="eyebrow">PAYROLL CENTER</span><h2>Salary statements</h2><p>Only payroll records published for your employee profile are shown.</p></div><div className="employee-filter-tabs">{(['Monthly Payslips', 'Annual Tax Summary'] as const).map((item) => <button type="button" key={item} className={tab === item ? 'is-active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div></header>
      {tab === 'Monthly Payslips' ? <div className="table-scroll"><table className="hr-table"><thead><tr><th>Period</th><th>Gross</th><th>Deductions</th><th>Net pay</th><th>Status</th><th>Payment date</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.period}</td><td>{money(earningTotal(row))}</td><td>{money(deductionTotal(row))}</td><td><strong>{money(netSalary(row))}</strong></td><td><span className={`status-pill status-${row.status.toLowerCase().replaceAll(' ', '-')}`}><i />{row.status}</span></td><td>{row.paymentDate ?? '—'}</td><td><button className="text-action" type="button" onClick={() => openPayslip(row)}>View / print</button></td></tr>)}{!rows.length && <tr><td colSpan={7}><div className="employee-empty-state"><FileText /><h3>No processed payslips yet</h3><p>Payroll statements will appear here after HR publishes them.</p></div></td></tr>}</tbody></table></div> : <div className="employee-tax-summary">{years.map((year) => { const data = rows.filter((row) => row.period.includes(year)); return <article className="card employee-tax-year" key={year}><header><CalendarDays size={18} /><h3>{year} tax summary</h3></header><div><span>Gross earnings<strong>{money(data.reduce((sum, row) => sum + earningTotal(row), 0))}</strong></span><span>TDS withheld<strong>{money(data.reduce((sum, row) => sum + row.tds, 0))}</strong></span><span>Professional tax<strong>{money(data.reduce((sum, row) => sum + row.professionalTax, 0))}</strong></span><span>Paid days<strong>{data.reduce((sum, row) => sum + row.paidDays, 0)}</strong></span></div></article> })}{!years.length && <div className="employee-empty-state"><FileText /><h3>No annual summary available</h3><p>Processed payroll records will be grouped by year here.</p></div>}</div>}
    </section>
    {selected && <div className="modal-backdrop employee-payslip-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="employee-payslip-modal" role="dialog" aria-modal="true" aria-labelledby="payslip-title"><div className="employee-payslip-print"><header><span className="eyebrow">PAYSLIP · {selected.period.toUpperCase()}</span><h2 id="payslip-title">{employee?.firstName} {employee?.lastName}</h2><p>{employee?.id} · {employee?.dept} · {employee?.title}</p></header><div className="employee-payslip-columns"><section><h3>Earnings</h3><PayslipLine label="Basic salary" value={selected.basic} /><PayslipLine label="HRA" value={selected.hra} /><PayslipLine label="Special allowance" value={selected.specialAllowance} /><PayslipLine label="Other allowances" value={selected.otherAllowances} /><PayslipLine label="Bonus" value={selected.bonus} /><PayslipLine label="Overtime" value={selected.overtime} /><PayslipLine label="Gross salary" value={earningTotal(selected)} total /></section><section><h3>Deductions</h3><PayslipLine label="PF" value={selected.pf} /><PayslipLine label="ESI" value={selected.esi} /><PayslipLine label="Professional tax" value={selected.professionalTax} /><PayslipLine label="TDS" value={selected.tds} /><PayslipLine label="Other deductions" value={selected.otherDeductions} /><PayslipLine label="Loss of pay" value={selected.lossOfPay} /><PayslipLine label="Total deductions" value={deductionTotal(selected)} total /></section></div><div className="employee-payslip-net"><span>Net pay</span><strong>{money(netSalary(selected))}</strong></div><p className="employee-payslip-footnote">{selected.paidDays} paid days of {selected.workingDays} working days · {selected.remarks}</p></div><div className="employee-payslip-actions"><button className="button" type="button" onClick={() => setSelected(null)}>Close</button><button className="button primary" type="button" onClick={printPayslip}><ArrowDownToLine size={15} /> Print / save as PDF</button></div></section></div>}
  </PageContainer>
}

function PayslipLine({ label, value, total = false }: { label: string; value: number; total?: boolean }) {
  return <div className={total ? 'employee-payslip-line is-total' : 'employee-payslip-line'}><span>{label}</span><strong>{money(value)}</strong></div>
}

function ShieldMini() { return <Check size={17} /> }
