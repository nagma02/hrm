import { ArrowRight, Wallet } from 'lucide-react'
import { navigateTo } from '@/app/router/navigation'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { earningTotal, netSalary } from '@/features/payroll/data/payrollData'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export default function PayrollSummary() {
  useHRMDataChange()
  const now = new Date()
  const period = `${now.toLocaleDateString('en-US', { month: 'long' })} ${now.getFullYear()}`
  const records = payrollService.list().filter((record) => record.period === period)
  const gross = records.reduce((sum, record) => sum + earningTotal(record), 0)
  const net = records.reduce((sum, record) => sum + netSalary(record), 0)
  const pending = records.filter((record) => ['Draft', 'Processing', 'Pending Approval'].includes(record.status)).length
  const simulated = records.filter((record) => record.status === 'Simulated').length
  return <section className="card hr-insights-card" aria-labelledby="dashboard-payroll-title">
    <div className="dashboard-section-heading"><div><div className="badge badge--info">Payroll · {period}</div><h3 className="section-title" id="dashboard-payroll-title">Payroll summary</h3></div><Wallet className="dashboard-section-icon" size={17}/></div>
    <div className="hr-insights-list">
      <div className="hr-insight-row"><span className="hr-insight-label">Gross payroll</span><strong className="hr-insight-value">{money(gross)}</strong></div>
      <div className="hr-insight-row"><span className="hr-insight-label">Net payroll</span><strong className="hr-insight-value">{money(net)}</strong></div>
      <div className="hr-insight-row"><span className="hr-insight-label">Awaiting approval or processing</span><strong className="hr-insight-value">{pending}</strong></div>
      <div className="hr-insight-row"><span className="hr-insight-label">Simulated payment states</span><strong className="hr-insight-value">{simulated}</strong></div>
    </div>
    <button className="text-action" onClick={() => navigateTo('/app/payroll')}>Open payroll <ArrowRight size={14}/></button>
    <small className="dashboard-data-note">Demo payroll figures. No payment transaction is connected.</small>
  </section>
}
