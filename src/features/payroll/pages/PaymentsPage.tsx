import { useMemo, useState } from 'react'
import { ArrowRight, BanknoteArrowUp, Clock3, Search } from 'lucide-react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { deductionTotal, earningTotal, netSalary } from '@/features/payroll/data/payrollData'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export function PaymentsPage() {
  useHRMDataChange()
  const records = payrollService.list()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesQuery = `${record.employeeName} ${record.employeeId} ${record.department}`.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'All' || record.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, records, status])

  const totalGross = filtered.reduce((sum, record) => sum + earningTotal(record), 0)
  const totalNet = filtered.reduce((sum, record) => sum + netSalary(record), 0)
  const pending = filtered.filter((record) => !['Paid', 'Simulated', 'Failed'].includes(record.status)).reduce((sum, record) => sum + netSalary(record), 0)
  const scheduled = filtered.filter((record) => ['Approved', 'Paid', 'Simulated'].includes(record.status)).length

  return (
    <PageContainer>
      <main className="payroll-page">
        <PageHeader
          title="Payments"
          subtitle="Track gross disbursement, approved payouts, and pending salary transfers."
          actions={
            <button className="button primary" type="button">
              <BanknoteArrowUp size={15} /> Payment overview
            </button>
          }
        />

        <section className="payroll-summary-grid" aria-label="Payment overview">
          {[
            ['Gross payout', money(totalGross)],
            ['Net disbursement', money(totalNet)],
            ['Pending payout', money(pending)],
            ['Approved entries', `${scheduled} / ${filtered.length || 0}`],
          ].map(([label, value]) => (
            <article className="payroll-summary-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{label === 'Pending payout' ? 'Awaiting fund transfer' : 'Current payment view'}</small>
            </article>
          ))}
        </section>

        <section className="panel payroll-records-panel">
          <div className="payroll-records-head">
            <div>
              <span className="eyebrow">PAYMENT TRACKER</span>
              <h2>Employee payment status</h2>
              <p>Review salary disbursement status and pending payouts by employee.</p>
            </div>
          </div>

          <div className="payroll-filters">
            <label className="table-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee or department" />
            </label>
            <select aria-label="Filter payment status" value={status} onChange={(event) => setStatus(event.target.value)}>
              {['All', 'Draft', 'Processing', 'Pending Approval', 'Approved', 'Simulated', 'Paid', 'Failed'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <span>{filtered.length} payment records</span>
          </div>

          <div className="table-scroll">
            <table className="hr-table payroll-records-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.employeeName}</strong>
                      <small>{record.employeeId}</small>
                    </td>
                    <td>{record.department}</td>
                    <td>{money(earningTotal(record))}</td>
                    <td>{money(deductionTotal(record))}</td>
                    <td className="table-primary-text">{money(netSalary(record))}</td>
                    <td>
                      <span className={`status-pill status-${record.status.toLowerCase().replaceAll(' ', '-')}`}>
                        <i />
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <button className="text-action" type="button">
                        View details <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <p className="payroll-empty">No payment records match these filters.</p>}
          </div>

          <footer className="payroll-table-footer">
            {pending > 0 ? 'Pending transfers require approval before completion.' : 'All current disbursements are in a settled state.'}
            <span><Clock3 size={14} /> Demo payment flow only; no bank transfer is triggered.</span>
          </footer>
        </section>
      </main>
    </PageContainer>
  )
}
