import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Activity, CircleCheckBig, HandCoins, Hourglass, PiggyBank, Scale, Wallet } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { payrollService } from '../services/payroll.service'
import { deductionTotal, earningTotal, netSalary } from '../data/payrollData'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { navigateTo } from '@/app/router/navigation'
import { getPayrollSettings, savePayrollSettings, type PayrollSettings } from '../services/payroll-settings.service'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { TableToolbar, TableFilterTabs, StatusDotBadge } from '@/components/tables'

const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)

export function PayrollApprovalsPage() {
  useHRMDataChange()
  const [month, setMonth] = useState('October')
  const [year, setYear] = useState('2026')
  const [loadedPeriod, setLoadedPeriod] = useState('October 2026')
  const pending = payrollService.list().filter((record) => record.status === 'Pending Approval' && record.period === loadedPeriod)
  const approve = (id: string) => {
    try { payrollService.updateStatus(id, 'Approved'); toast.success('Payroll approved.') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not approve payroll.') }
  }
  return (
    <PageContainer>
      <div className="payroll-page">
        <PageHeader
          title="Payroll Approvals"
          subtitle="Review and action payroll records assigned to you."
          actions={<button className="button" onClick={() => navigateTo('/app/payroll')}>Back to Management</button>}
        />
        <TableFilterTabs
          tabs={[{ id: 'Pending Approval', label: 'Pending Approval', count: pending.length }]}
          activeTab="Pending Approval"
          onTabChange={() => undefined}
        />
        <TableToolbar
          searchQuery=""
          onSearchChange={() => undefined}
          searchPlaceholder="Search records..."
        >
          <label>Month
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Year
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              {['2026','2025','2024'].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <button className="button primary" onClick={() => setLoadedPeriod(`${month} ${year}`)}>Load</button>
        </TableToolbar>
        <section className="panel payroll-records-panel">
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.NO</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <strong>{record.employeeName}</strong>
                      <small className="block text-xs text-muted-foreground">{record.employeeId}</small>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell>{money(earningTotal(record))}</TableCell>
                    <TableCell>{money(netSalary(record))}</TableCell>
                    <TableCell><StatusDotBadge status={record.status} /></TableCell>
                    <TableCell>
                      <button className="button primary" onClick={() => approve(record.id)}>Approve</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!pending.length && (
              <div className="payroll-approval-empty">
                <b>No pending approvals for this period</b>
                <span>All payroll records have been actioned.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

export function EmployeeDeductionsPage() {
  useHRMDataChange()
  const records = payrollService.list()
  return (
    <PageContainer>
      <div className="payroll-page">
        <PageHeader title="Employee Deductions" subtitle="Review deductions applied to each payroll record." />
        <section className="panel payroll-records-panel">
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.NO</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>ESI</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Other</TableHead>
                  <TableHead>Total Deductions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <strong>{record.employeeName}</strong>
                      <small className="block text-xs text-muted-foreground">{record.employeeId}</small>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell>{money(record.pf)}</TableCell>
                    <TableCell>{money(record.esi)}</TableCell>
                    <TableCell>{money(record.professionalTax + record.tds)}</TableCell>
                    <TableCell>{money(record.otherDeductions + record.lossOfPay)}</TableCell>
                    <TableCell>{money(deductionTotal(record))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!records.length && <div className="empty-state">No payroll deductions found.</div>}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}

type LoanStatus = 'Completed' | 'Rejected' | 'Pending' | 'Active'
/** Icons for the loan summary cards, in the order of `summary` below. */
const loanSummaryIcons = [Hourglass, Activity, CircleCheckBig, HandCoins, PiggyBank, Scale]
type LoanRow = { id: string; employee: string; employeeId: string; department: string; type: 'Loan' | 'Salary Advance'; amount: number; emi: number; months: number; paid: number; status: LoanStatus; appliedOn: string }
const loanSeed: LoanRow[] = [
  { id: 'LN-001', employee: 'Pranjal Agnihotri', employeeId: 'AR-012', department: 'Finance & Accounts', type: 'Salary Advance', amount: 15000, emi: 15000, months: 1, paid: 15000, status: 'Completed', appliedOn: '2026-09-10' },
  { id: 'LN-002', employee: 'Nadeem Ahmad', employeeId: 'ADR-025', department: 'Sales', type: 'Salary Advance', amount: 10000, emi: 10000, months: 1, paid: 10000, status: 'Completed', appliedOn: '2026-09-03' },
  { id: 'LN-003', employee: 'Udit Narayan Chaudhary', employeeId: 'ADR-109', department: 'Sales', type: 'Salary Advance', amount: 6000, emi: 6000, months: 1, paid: 0, status: 'Rejected', appliedOn: '2026-08-27' },
  { id: 'LN-004', employee: 'Rohan Rawat', employeeId: 'MI-007', department: 'Admin', type: 'Salary Advance', amount: 1000, emi: 1000, months: 1, paid: 1000, status: 'Completed', appliedOn: '2026-08-27' },
  { id: 'LN-005', employee: 'Amit Rawat', employeeId: 'MI-008', department: 'Admin', type: 'Loan', amount: 2000, emi: 1000, months: 2, paid: 2000, status: 'Completed', appliedOn: '2026-08-27' },
  { id: 'LN-006', employee: 'Amit Rawat', employeeId: 'MI-008', department: 'Admin', type: 'Salary Advance', amount: 2000, emi: 2000, months: 1, paid: 0, status: 'Rejected', appliedOn: '2026-08-27' },
  { id: 'LN-007', employee: 'Prashant Mani Tiwari', employeeId: 'ADR-005', department: 'Sales', type: 'Salary Advance', amount: 3000, emi: 3000, months: 1, paid: 3000, status: 'Completed', appliedOn: '2026-08-01' },
  { id: 'LN-008', employee: 'Rohan Rawat', employeeId: 'MI-007', department: 'Admin', type: 'Salary Advance', amount: 1000, emi: 1000, months: 1, paid: 1000, status: 'Completed', appliedOn: '2026-07-30' },
  { id: 'LN-009', employee: 'Prashant Mani Tiwari', employeeId: 'ADR-005', department: 'Sales', type: 'Salary Advance', amount: 5000, emi: 5000, months: 1, paid: 5000, status: 'Completed', appliedOn: '2026-07-24' },
  { id: 'LN-010', employee: 'Prashant Mani Tiwari', employeeId: 'ADR-005', department: 'Sales', type: 'Salary Advance', amount: 15000, emi: 15000, months: 1, paid: 15000, status: 'Completed', appliedOn: '2026-07-13' },
  { id: 'LN-011', employee: 'Nadeem Ahmad', employeeId: 'ADR-025', department: 'Sales', type: 'Salary Advance', amount: 10000, emi: 10000, months: 1, paid: 10000, status: 'Completed', appliedOn: '2026-07-09' },
]
function getLoans(): LoanRow[] {
  try { const stored = JSON.parse(localStorage.getItem('hrm-loans-advances') ?? 'null') as LoanRow[] | null; return Array.isArray(stored) ? stored : loanSeed }
  catch { return loanSeed }
}
export function PayrollLoansPage() {
  const revision = useHRMDataChange()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All Statuses')
  const [type, setType] = useState('All Types')
  const [selected, setSelected] = useState<LoanRow | null>(null)
  const loans = getLoans()
  const visible = useMemo(() => loans.filter((row) => (status === 'All Statuses' || row.status === status) && (type === 'All Types' || row.type === type) && `${row.employee} ${row.employeeId} ${row.department}`.toLowerCase().includes(query.toLowerCase().trim())), [loans, query, revision, status, type])
  const amount = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
  const completed = loans.filter((row) => row.status === 'Completed')
  const summary = [['Pending', loans.filter((row) => row.status === 'Pending').length, '#1B362B'], ['Active', loans.filter((row) => row.status === 'Active').length, '#1B362B'], ['Completed', completed.length, '#1B362B'], ['Disbursed', amount(completed.reduce((sum, row) => sum + row.amount, 0)), '#1B362B'], ['Recovered', amount(completed.reduce((sum, row) => sum + row.paid, 0)), '#1B362B'], ['Outstanding', amount(loans.filter((row) => row.status === 'Active').reduce((sum, row) => sum + row.amount - row.paid, 0)), '#1B362B']] as const
  return (
    <PageContainer>
      <div className="loan-page">
        <PageHeader title="Loan & Salary Advance Management" subtitle="Track, approve and manage employee loan/advance applications." />
        <div className="loan-summary-grid">
          {summary.map(([label, value], index) => {
            const Icon = loanSummaryIcons[index] ?? Wallet
            return <StatCard key={label} label={String(label)} value={value} icon={<Icon size={18} />} />
          })}
        </div>
        <TableFilterTabs
          tabs={[
            { id: 'All Types', label: 'All Types', count: loans.length },
            { id: 'Loan', label: 'Loan', count: loans.filter(r => r.type === 'Loan').length },
            { id: 'Salary Advance', label: 'Salary Advance', count: loans.filter(r => r.type === 'Salary Advance').length },
          ]}
          activeTab={type}
          onTabChange={setType}
        />
        <TableToolbar
          searchQuery={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search by name or Employee ID..."
          filterValue={status}
          onFilterChange={setStatus}
          filterOptions={['All Statuses', 'Pending', 'Active', 'Completed', 'Rejected'].map(v => ({ label: v, value: v }))}
          filterLabel="All Statuses"
        />
        <section className="panel loan-table-panel">
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>EMI</TableHead>
                  <TableHead>Months</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <strong>{row.employee}</strong>
                      <small className="block text-xs text-muted-foreground">{row.employeeId} · {row.department}</small>
                    </TableCell>
                    <TableCell>
                      <span className={`loan-type loan-type-${row.type === 'Loan' ? 'loan' : 'advance'}`}>{row.type}</span>
                    </TableCell>
                    <TableCell>{amount(row.amount)}</TableCell>
                    <TableCell>{amount(row.emi)}</TableCell>
                    <TableCell>{row.months}</TableCell>
                    <TableCell className="loan-paid">{amount(row.paid)}</TableCell>
                    <TableCell className="loan-remaining">{amount(Math.max(0, row.amount - row.paid))}</TableCell>
                    <TableCell><StatusDotBadge status={row.status} /></TableCell>
                    <TableCell>{new Date(`${row.appliedOn}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>
                      <button className="attendance-view-link" onClick={() => setSelected(row)}>View</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!visible.length && <div className="empty-state">No loan or advance records match these filters.</div>}
          </div>
        </section>
        {selected && (
          <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
            <section className="comp-off-modal" role="dialog" aria-modal="true">
              <button className="modal-close" aria-label="Close" onClick={() => setSelected(null)}>×</button>
              <span className="eyebrow">{selected.type}</span>
              <h2>{selected.employee}</h2>
              <p>{selected.employeeId} · {selected.department}</p>
              <dl>
                <div><dt>Amount</dt><dd>{amount(selected.amount)}</dd></div>
                <div><dt>Monthly EMI</dt><dd>{amount(selected.emi)}</dd></div>
                <div><dt>Term</dt><dd>{selected.months} months</dd></div>
                <div><dt>Total paid</dt><dd>{amount(selected.paid)}</dd></div>
                <div><dt>Remaining</dt><dd>{amount(Math.max(0, selected.amount - selected.paid))}</dd></div>
                <div><dt>Status</dt><dd>{selected.status}</dd></div>
              </dl>
            </section>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

type SettingsTab = 'Company Information' | 'Salary Components' | 'Deduction Configuration' | 'Workflow & Automation' | 'Payment Configuration' | 'Incentive Payroll Configuration'
const settingsTabs: SettingsTab[] = ['Company Information', 'Salary Components', 'Deduction Configuration', 'Workflow & Automation', 'Payment Configuration', 'Incentive Payroll Configuration']
type PayrollConfig = PayrollSettings

export function PayrollSettingsPage() {
  const [settings, setSettings] = useState<PayrollConfig>(getPayrollSettings)
  const [tab, setTab] = useState<SettingsTab>('Company Information')
  const update = (key: keyof PayrollConfig['workflow'], value: boolean | string) => setSettings((current) => ({ ...current, workflow: { ...current.workflow, [key]: value } }))
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settings.companyName.trim()) { toast.error('Company name is required.'); setTab('Company Information'); return }
    const start = Number(settings.workflow.windowStart)
    const end = Number(settings.workflow.windowEnd)
    if (settings.workflow.generationWindow && (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > 31 || start > end)) { toast.error('Enter a valid payroll generation window from day 1 to 31.'); setTab('Workflow & Automation'); return }
    const paymentDay = Number(settings.payment.date)
    if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) { toast.error('Payment day must be between 1 and 31.'); setTab('Payment Configuration'); return }
    savePayrollSettings(settings)
    toast.success(`${tab} saved. New payroll actions will use these settings.`)
  }
  const toggle = (key: keyof PayrollConfig['workflow'], label: string, hint: string) => <label className="payroll-check-option" key={key}><input type="checkbox" checked={Boolean(settings.workflow[key])} onChange={(event) => update(key, event.target.checked)} /><span><b>{label}</b><small>{hint}</small></span></label>
  const panel = tab === 'Company Information' ? <section className="payroll-settings-card"><h2>Company Details</h2><div className="payroll-settings-fields"><label>Company Name *<input value={settings.companyName} onChange={(event) => setSettings({ ...settings, companyName: event.target.value })} /></label><label>Company Logo URL<input value={settings.companyLogo} placeholder="https://example.com/logo.png" onChange={(event) => setSettings({ ...settings, companyLogo: event.target.value })} /></label><label className="full">Address<textarea value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} /></label><label>Email<input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} /></label><label>Phone<input value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} /></label></div><p className="payroll-settings-note">Company information is used in generated payslips and reports.</p></section>
    : tab === 'Salary Components' ? <section className="payroll-settings-card"><button className="button primary" type="button" onClick={() => { const name = window.prompt('Salary component name'); if (name?.trim()) setSettings({ ...settings, components: [...settings.components, { name: name.trim(), code: name.trim().slice(0, 3).toUpperCase(), type: 'earning', calc: 'fixed', value: '₹0', basedOn: 'basic' }] }) }}>+ Add Salary Component</button><div className="table-scroll"><Table><TableHeader><TableRow><TableHead>Component Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Calc Type</TableHead><TableHead>Value</TableHead><TableHead>Based On</TableHead><TableHead>Auto Include</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{settings.components.map((item) => <TableRow key={item.code}><TableCell>{item.name}</TableCell><TableCell>{item.code}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.calc}</TableCell><TableCell>{item.value}</TableCell><TableCell>{item.basedOn}</TableCell><TableCell>✓</TableCell><TableCell>Active</TableCell><TableCell><button type="button" className="payroll-delete-link" onClick={() => setSettings({ ...settings, components: settings.components.filter((row) => row.code !== item.code) })}>Delete</button></TableCell></TableRow>)}</TableBody></Table></div></section>
    : tab === 'Deduction Configuration' ? <section className="payroll-settings-card"><p>Create and manage deduction types. They can be assigned to employees under Payroll → Employee Deductions.</p><button className="button primary" type="button" onClick={() => { const name = window.prompt('Deduction type name'); if (name?.trim()) setSettings({ ...settings, deductions: [...settings.deductions, { name: name.trim(), code: name.trim().slice(0, 3).toUpperCase(), calc: 'Manual', base: 'Manual', value: '—', recurring: 'One_time', active: true }] }) }}>+ Add Deduction Type</button><div className="table-scroll"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Calc Type</TableHead><TableHead>Base</TableHead><TableHead>Default Value</TableHead><TableHead>Recurring</TableHead><TableHead>Auto Apply</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{settings.deductions.map((item) => <TableRow key={item.code}><TableCell>{item.name}</TableCell><TableCell>{item.code}</TableCell><TableCell>{item.calc}</TableCell><TableCell>{item.base}</TableCell><TableCell>{item.value}</TableCell><TableCell>{item.recurring}</TableCell><TableCell>✓</TableCell><TableCell>{item.active ? 'Active' : 'Inactive'}</TableCell><TableCell><button type="button" className="payroll-delete-link" onClick={() => setSettings({ ...settings, deductions: settings.deductions.map((row) => row.code === item.code ? { ...row, active: !row.active } : row) })}>{item.active ? 'Deactivate' : 'Activate'}</button></TableCell></TableRow>)}</TableBody></Table></div></section>
    : tab === 'Workflow & Automation' ? <div className="payroll-settings-sections"><section className="payroll-settings-card"><h2>Generation Window</h2><p>Choose when payroll may be generated for the previous month.</p>{toggle('generationWindow', 'Enable Payroll Generation Window', 'When disabled, payroll can be generated on any date.') }<div className="payroll-settings-fields compact">{[['windowStart','Window Start Day'],['windowEnd','Window End Day'],['cutoffDay','Attendance Cutoff Day'],['lockDay','Lock Day'],['paymentDay','Payment Day']].map(([key,label])=><label key={key}>{label}<input type="number" value={settings.workflow[key as keyof PayrollConfig['workflow']] as string} onChange={(event)=>update(key as keyof PayrollConfig['workflow'],event.target.value)} /></label>)}</div></section><section className="payroll-settings-card"><h2>Approval & Regeneration</h2><div className="payroll-settings-checks">{toggle('requireApproval','Require Final Approval','Payroll must complete approval before publishing.')}{toggle('allowRegeneration','Allow Regeneration','Permit recalculating a payroll after approval.')}{toggle('superAdminRegeneration','Regeneration: Super Admin Only','Limit payroll regeneration to super admins.')}{toggle('superAdminBypass','Super Admin Bypasses Window','Allow super admins to bypass generation dates.')}</div></section><section className="payroll-settings-card"><h2>Post-Approval Automation</h2><div className="payroll-settings-checks">{toggle('autoPayslip','Auto-Generate Payslip PDF','Generate a payslip after final approval.')}{toggle('autoUpload','Auto-Upload to Cloudinary','Upload the generated payslip.')}{toggle('autoPublish','Auto-Publish to Employee','Make the payslip visible to the employee.')}{toggle('unlockAfterApproval','Unlock Payroll After Final Approval','Unlock approved payroll for payment.')}</div></section><section className="payroll-settings-card"><h2>Notifications & Pre-Generation Validation</h2><div className="payroll-settings-checks">{toggle('notifyApprovers','Notify Approvers on Generate','Notify approvers when payroll is generated.')}{toggle('notifyEmployee','Notify Employee on Publish','Notify employees when payslips are published.')}{toggle('emailOnApproval','Send Email on Final Approval','Email employees after final approval.')}{toggle('validateBank','Validate Bank Details','Warn if employee bank information is missing.')}{toggle('validatePan','Validate PAN Card','Warn when PAN details are missing.')}{toggle('validateUan','Validate UAN / ESIC','Warn when UAN or ESIC details are missing.')}{toggle('blockNegative','Block Negative Net Salary','Prevent a negative payroll result.')}</div></section></div>
    : tab === 'Payment Configuration' ? <div className="payroll-settings-sections"><section className="payroll-settings-card"><h2>Payment Processing Mode</h2>{['Manual (One by One)','Bulk Manual','Automatic After Publish','Scheduled Automatic','Bank API Integration (Future)'].map((mode) => <label className="payroll-radio-option" key={mode}><input type="radio" checked={settings.payment.mode === mode} onChange={() => setSettings({ ...settings, payment: { ...settings.payment, mode } })} /><span><b>{mode}</b><small>Configure how payroll payments are processed.</small></span></label>)}</section><section className="payroll-settings-card"><h2>Bulk Payment Settings</h2><label className="payroll-check-option"><input type="checkbox" checked={settings.payment.bulkEnabled} onChange={(event)=>setSettings({...settings,payment:{...settings.payment,bulkEnabled:event.target.checked}})} />Enable Bulk Payment</label><div className="payroll-settings-fields"><label>Default Payment Method<select value={settings.payment.method} onChange={(event)=>setSettings({...settings,payment:{...settings.payment,method:event.target.value}})}>{['NEFT','IMPS','RTGS','UPI','Cheque'].map((method)=><option key={method}>{method}</option>)}</select></label><label>Default Payment Status<select value={settings.payment.defaultStatus} onChange={(event)=>setSettings({...settings,payment:{...settings.payment,defaultStatus:event.target.value}})}><option>Pending</option><option>Processing</option></select></label></div></section><section className="payroll-settings-card"><h2>Scheduled Payment</h2><div className="payroll-settings-fields"><label>Payment Date (Day of Month)<input type="number" min="1" max="31" value={settings.payment.date} onChange={(event)=>setSettings({...settings,payment:{...settings.payment,date:event.target.value}})} /></label><label>Payment Time<input type="time" value={settings.payment.time} onChange={(event)=>setSettings({...settings,payment:{...settings.payment,time:event.target.value}})} /></label></div></section><p className="payroll-settings-note">These are saved payment preferences only. A bank API or automatic payment scheduler is not connected, so saved settings never mark payroll as paid or send money.</p></div>
    : <div className="payroll-settings-sections"><section className="payroll-settings-card"><h2>Incentive Payroll Configuration</h2><label className="payroll-check-option"><input type="checkbox" checked={settings.incentive.enabled} onChange={(event)=>setSettings({...settings,incentive:{...settings.incentive,enabled:event.target.checked}})} />Enable Incentive Integration</label></section><section className="payroll-settings-card"><h2>Merge Mode & Timing</h2><div className="payroll-settings-fields"><label>Merge mode<select value={settings.incentive.mergeMode} onChange={(event)=>setSettings({...settings,incentive:{...settings.incentive,mergeMode:event.target.value}})}><option>Automatic</option><option>Manual</option></select></label><label>Merge timing<select value={settings.incentive.mergeTiming} onChange={(event)=>setSettings({...settings,incentive:{...settings.incentive,mergeTiming:event.target.value}})}><option>Immediately after Payment Processed</option><option>After final approval</option><option>Manual merge</option></select></label></div></section><section className="payroll-settings-card"><h2>Eligible Payment Status & Merge Behaviour</h2><div className="payroll-settings-checks">{(['pending','processing','processed','rejected','includePrevious','preventDuplicate','recalculate','logMerge','notifyEmployee','notifyFinance','notifyAdmin'] as const).map((key)=> <label className="payroll-check-option" key={key}><input type="checkbox" checked={settings.incentive[key]} onChange={(event)=>setSettings({...settings,incentive:{...settings.incentive,[key]:event.target.checked}})} />{key.replaceAll(/([A-Z])/g,' $1').replace(/^./,(letter)=>letter.toUpperCase())}</label>)}</div></section></div>
  return <PageContainer><div className="payroll-settings-page"><PageHeader eyebrow="Payroll" title="Payroll Settings" subtitle="Configure payroll parameters and salary components" /><nav className="payroll-settings-tabs" aria-label="Payroll settings sections">{settingsTabs.map((item)=><button key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}>{item}</button>)}</nav><form onSubmit={save}><div className="payroll-settings-content">{panel}{(tab === 'Workflow & Automation' || tab === 'Incentive Payroll Configuration') && <p className="payroll-settings-note">Email delivery, Cloudinary uploads, scheduled jobs, and incentive merging require external integrations that are not connected in this app. Their settings are stored, but those external actions will not run.</p>}</div><button className="button primary" type="submit">Save {tab}</button></form></div></PageContainer>
}
