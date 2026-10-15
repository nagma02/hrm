import { useMemo, useState, type FormEvent } from 'react'
import { eachDayOfInterval, format, isWeekend, parseISO } from 'date-fns'
import { CalendarDays, Check, ChevronRight, Plus, Umbrella, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/use-auth'
import { leaveService } from '@/features/leave/services/leave.service'
import { leaveTypes, type LeaveType } from '@/features/leave/types/leave.types'
import { useLeaveApplications } from '@/features/leave/hooks/useLeaveApplications'
import { useHRContent } from '@/features/hr-content/hooks/useHRContent'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

type Balance = { type: string; entitled: number; used: number; carryForward: number }
type ApplyForm = { leaveType: LeaveType; startDate: string; endDate: string; reason: string }
const today = () => format(new Date(), 'yyyy-MM-dd')
const statusClass = (status: string) => `status-${status.toLowerCase()}`

function employeeBalances(employeeId: string): Balance[] {
  try {
    const rows = JSON.parse(localStorage.getItem('hrm-employee-ess-seed') ?? '[]') as Array<{ employeeId: string; leaveBalances?: Balance[] }>
    return rows.find((row) => row.employeeId === employeeId)?.leaveBalances ?? []
  } catch { return [] }
}

function requestedDays(startDate: string, endDate: string, holidayDates: Set<string>) {
  if (!startDate || !endDate || endDate < startDate) return 0
  return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).filter((day) => !isWeekend(day) && !holidayDates.has(format(day, 'yyyy-MM-dd'))).length
}

export default function LeavePage({ focusRequests = false }: { focusRequests?: boolean }) {
  const { user } = useAuth()
  const { employeeId, employee } = useEmployeeRecord()
  const revision = useHRMDataChange()
  const requests = useLeaveApplications()
  const { holidays } = useHRContent()
  const rows = requests.filter((item) => item.employeeId === employeeId)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<ApplyForm>({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' })
  const holidayDates = useMemo(() => new Set(holidays.map((item) => item.date)), [holidays])
  const balances = useMemo(() => employeeBalances(employeeId), [employeeId, revision, rows.length])
  const days = requestedDays(form.startDate, form.endDate, holidayDates)
  const balanceCards = ['Casual Leave', 'Sick Leave', 'Earned Leave'].map((type) => {
    const balance = balances.find((item) => item.type === type || (type === 'Earned Leave' && item.type === 'Annual Leave'))
    const pending = rows.filter((item) => item.leaveType === type && item.status === 'Pending').reduce((sum, item) => sum + item.numberOfDays, 0)
    const entitled = balance?.entitled ?? 0
    const used = balance?.used ?? 0
    const remaining = Math.max(0, entitled + (balance?.carryForward ?? 0) - used - pending)
    return { type, entitled, used, pending, remaining, percent: entitled ? Math.min(100, (used + pending) / (entitled + (balance?.carryForward ?? 0)) * 100) : 0 }
  })
  const filteredRows = [...rows].sort((left, right) => right.appliedDate.localeCompare(left.appliedDate))
  const openForm = () => { setForm({ leaveType: 'Casual Leave', startDate: '', endDate: '', reason: '' }); setShowForm(true) }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employee || !employeeId) { toast.error('Your employee profile is not linked to this account.'); return }
    if (form.startDate < today()) { toast.error('Leave dates cannot be in the past.'); return }
    if (form.endDate < form.startDate) { toast.error('End date must be on or after the start date.'); return }
    if (!days) { toast.error('The selected period has no working days after weekends and holidays are excluded.'); return }
    if (form.reason.trim().length < 5) { toast.error('Add a short reason for your leave request.'); return }
    const overlapping = rows.some((item) => item.status === 'Pending' || item.status === 'Approved'
      ? item.startDate <= form.endDate && item.endDate >= form.startDate : false)
    if (overlapping) { toast.error('This period overlaps another pending or approved request.'); return }
    const balance = balanceCards.find((item) => item.type === form.leaveType || (form.leaveType === 'Annual Leave' && item.type === 'Earned Leave'))
    if (form.leaveType !== 'Unpaid Leave' && balance && days > balance.remaining) { toast.error(`You have ${balance.remaining} day(s) available for ${form.leaveType}.`); return }
    setBusy(true)
    try {
      await leaveService.applyLeave({ employeeId, employeeName: `${employee.firstName} ${employee.lastName}`, employeeEmail: employee.email || user?.email || '', employeePhone: employee.phone, leaveType: form.leaveType, startDate: form.startDate, endDate: form.endDate, numberOfDays: days, reason: form.reason.trim() })
      setShowForm(false)
      toast.success('Leave request submitted. Admin reviewers can see it now.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to submit the leave request.') }
    finally { setBusy(false) }
  }
  const cancel = async (id: string) => {
    if (!window.confirm('Cancel this pending leave request?')) return
    try { await leaveService.cancel(id); toast.success('Leave request cancelled.') }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to cancel the request.') }
  }

  return <PageContainer>
    <PageHeader title={focusRequests ? 'My leave requests' : 'My leave'} subtitle="Review available leave and track requests shared with HR." actions={<><button className="button" type="button" onClick={() => window.location.assign('/employee/leave/requests')}>Request history <ChevronRight size={15} /></button><button className="button primary" type="button" onClick={openForm}><Plus size={16} /> Apply leave</button></>} />
    <section className="employee-leave-balance-strip">{balanceCards.map((balance) => <article className="card employee-leave-balance-card" key={balance.type}><div className="employee-card-heading"><span className="employee-card-icon"><Umbrella size={17} /></span><span className="eyebrow">{balance.type}</span></div><strong><b>{balance.remaining}</b> days remaining</strong><div className="employee-leave-progress" role="progressbar" aria-label={`${balance.type} used and pending`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(balance.percent)}><span style={{ width: `${balance.percent}%` }} /></div><small>{balance.used} used · {balance.pending} pending · {balance.entitled + (balances.find((item) => item.type === balance.type)?.carryForward ?? 0)} entitled</small></article>)}</section>
    {form.startDate && form.endDate && <p className="employee-leave-day-preview"><CalendarDays size={15} /> {days} working day(s) requested after weekends and published holidays are excluded.</p>}
    <section className="card employee-data-card"><header className="employee-data-toolbar"><div><span className="eyebrow">MY TIME OFF</span><h2>Leave request history</h2><p>{filteredRows.length} request(s) · approved, pending and past requests</p></div><div className="employee-leave-status-summary">{['Pending', 'Approved', 'Rejected'].map((status) => <span key={status} className={`status-pill ${statusClass(status)}`}><i />{status} {filteredRows.filter((item) => item.status === status).length}</span>)}</div></header>
      <div className="table-scroll"><table className="hr-table"><thead><tr><th>Leave type</th><th>Dates</th><th>Days</th><th>Applied</th><th>Status</th><th>Decision / remarks</th><th>Action</th></tr></thead><tbody>{filteredRows.map((item) => <tr key={item.id}><td>{item.leaveType}</td><td>{format(parseISO(item.startDate), 'MMM d, yyyy')} – {format(parseISO(item.endDate), 'MMM d, yyyy')}</td><td>{item.numberOfDays}</td><td>{format(parseISO(item.appliedDate), 'MMM d, yyyy')}</td><td><span className={`status-pill ${statusClass(item.status)}`}><i />{item.status}</span></td><td>{item.decisionComment || item.rejectionReason || item.decisionBy || '—'}</td><td>{item.status === 'Pending' ? <button className="button" type="button" onClick={() => void cancel(item.id)}><X size={14} /> Cancel</button> : '—'}</td></tr>)}{!filteredRows.length && <tr><td colSpan={7}><div className="employee-empty-state"><Umbrella /><h3>No leave requests yet</h3><p>Apply for leave to start a request that your manager can review.</p></div></td></tr>}</tbody></table></div>
    </section>
    {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="form-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="apply-leave-title"><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowForm(false)}>×</button><p className="eyebrow">LEAVE REQUEST</p><h2 id="apply-leave-title">Apply for leave</h2><label>Leave type<select value={form.leaveType} onChange={(event) => setForm((current) => ({ ...current, leaveType: event.target.value as LeaveType }))}>{leaveTypes.map((type) => <option key={type}>{type}</option>)}</select></label><div className="employee-form-grid"><label>Start date<input required type="date" min={today()} value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} /></label><label>End date<input required type="date" min={form.startDate || today()} value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} /></label></div><label>Reason<textarea required minLength={5} maxLength={500} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Share a brief reason with your manager." /></label><div className="employee-leave-preview"><strong>{days} working day(s)</strong><small>{form.leaveType === 'Unpaid Leave' ? 'Unpaid leave' : `${balanceCards.find((item) => item.type === form.leaveType || (form.leaveType === 'Annual Leave' && item.type === 'Earned Leave'))?.remaining ?? 0} day(s) currently available`}</small></div><div className="modal-actions"><button type="button" className="button" disabled={busy} onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="button primary" disabled={busy}><Check size={15} />{busy ? 'Submitting…' : 'Submit request'}</button></div></form></div>}
  </PageContainer>
}
