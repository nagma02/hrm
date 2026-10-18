import { useMemo, useState } from 'react'
import { BadgeCheck, Banknote, Download, Eye, Clock3, Hourglass, Search, Wallet } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { deductionTotal, earningTotal, netSalary } from '@/features/payroll/data/payrollData'
import type { PayrollRecord } from '@/features/payroll/types/payroll.types'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

type PaymentsPageProps = {
  /** `employee` limits every figure, row and export to the signed-in employee's own payroll. */
  scope?: 'admin' | 'employee'
}

export function PaymentsPage({ scope = 'admin' }: PaymentsPageProps) {
  useHRMDataChange()
  const { employeeId } = useEmployeeRecord()
  const employeeScope = scope === 'employee'
  // Fail closed: an employee without a linked record sees no payroll rows at all.
  const records = payrollService.list().filter((record) => !employeeScope || (employeeId !== '' && record.employeeId === employeeId))
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)

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
  const exportPayments = () => {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [['Employee', 'Employee ID', 'Department', 'Gross', 'Deductions', 'Net pay', 'Status'], ...filtered.map((record) => [record.employeeName, record.employeeId, record.department, earningTotal(record), deductionTotal(record), netSalary(record), record.status])]
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = employeeScope ? 'my-payments.csv' : 'payment-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageContainer>
      <div className="payroll-page">
        <PageHeader
          title={employeeScope ? 'My payments' : 'Payments'}
          subtitle={employeeScope ? 'Your salary disbursements, approved payouts, and pending transfers.' : 'Track gross disbursement, approved payouts, and pending salary transfers.'}
          actions={
            <button className="button primary" type="button" onClick={exportPayments}>
              <Download size={15} /> {employeeScope ? 'Download my payments' : 'Export payment report'}
            </button>
          }
        />

        <section className="payroll-summary-grid" aria-label="Payment overview">
          {([
            ['Gross payout', money(totalGross), Wallet],
            ['Net disbursement', money(totalNet), Banknote],
            ['Pending payout', money(pending), Hourglass],
            ['Approved entries', `${scheduled} / ${filtered.length || 0}`, BadgeCheck],
          ] as const).map(([label, value, Icon]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              hint={label === 'Pending payout' ? 'Awaiting fund transfer' : 'Current payment view'}
              icon={<Icon size={18} />}
            />
          ))}
        </section>

        <section className="panel payroll-records-panel">
          <div className="payroll-records-head">
            <div>
              <span className="eyebrow">PAYMENT TRACKER</span>
              <h2>{employeeScope ? 'Payment history' : 'Employee payment status'}</h2>
              <p>{employeeScope ? 'Each pay period with its gross, deductions, net pay and transfer status.' : 'Review salary disbursement status and pending payouts by employee.'}</p>
            </div>
          </div>

          <div className="payroll-filters">
            <label className="table-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee or department" />
            </label>
            <ToolbarSelect ariaLabel="Filter payment status" value={status} onValueChange={setStatus} options={['All', 'Draft', 'Processing', 'Pending Approval', 'Approved', 'Simulated', 'Paid', 'Failed'].map((item) => ({ label: String(item), value: String(item) }))} />
            <span>{filtered.length} payment records</span>
          </div>

          <div className="table-scroll">
            <Table className="hr-table payroll-records-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <strong>{record.employeeName}</strong>
                      <small className="block text-xs text-muted-foreground">{record.employeeId}</small>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{money(earningTotal(record))}</TableCell>
                    <TableCell>{money(deductionTotal(record))}</TableCell>
                    <TableCell className="table-primary-text font-semibold">{money(netSalary(record))}</TableCell>
                    <TableCell>
                      <span className={`status-pill status-${record.status.toLowerCase().replaceAll(' ', '-')}`}>
                        <i />
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ActionDropdown
                        label={`Actions for ${record.employeeName}`}
                        actions={[
                          { label: 'View details', icon: <Eye size={13} />, onClick: () => setSelectedRecord(record) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!filtered.length && <p className="payroll-empty">No payment records match these filters.</p>}
          </div>

          <footer className="payroll-table-footer">
            {pending > 0 ? 'Pending transfers require approval before completion.' : 'All current disbursements are in a settled state.'}
            <span><Clock3 size={14} /> Demo payment flow only; no bank transfer is triggered.</span>
          </footer>
        </section>
        {selectedRecord && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelectedRecord(null)}><section className="payslip-modal" role="dialog" aria-modal="true" aria-labelledby="payment-details-title"><button className="modal-close" aria-label="Close payment details" onClick={() => setSelectedRecord(null)}>×</button><span className="eyebrow">PAYMENT DETAILS · {selectedRecord.period}</span><h2 id="payment-details-title">{selectedRecord.employeeName}</h2><dl><div><dt>Employee ID</dt><dd>{selectedRecord.employeeId}</dd></div><div><dt>Department</dt><dd>{selectedRecord.department}</dd></div><div><dt>Gross pay</dt><dd>{money(earningTotal(selectedRecord))}</dd></div><div><dt>Deductions</dt><dd>{money(deductionTotal(selectedRecord))}</dd></div><div><dt>Net pay</dt><dd>{money(netSalary(selectedRecord))}</dd></div><div><dt>Status</dt><dd>{selectedRecord.status}</dd></div><div><dt>Payment reference</dt><dd>{selectedRecord.referenceId}</dd></div><div><dt>Payment method</dt><dd>{selectedRecord.paymentMethod}</dd></div></dl><p className="payslip-demo-note">Payment data is local demo information; this view does not initiate a bank transfer.</p><button className="button" onClick={() => setSelectedRecord(null)}>Close</button></section></div>}
      </div>
    </PageContainer>
  )
}
