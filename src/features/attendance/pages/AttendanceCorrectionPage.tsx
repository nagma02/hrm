import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import { attendanceSchema } from '@/schemas/attendance.schema'
import { sanitizeText } from '@/utils/sanitize-text'
import { useNavigate } from 'react-router-dom'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { useCurrentEmployee } from '@/features/employees/utils/employee-identity'
import { attendanceDateKey, listAttendanceRows, updateAttendanceRow, type AttendanceCorrectionRecord } from '@/features/attendance/services/attendance.service'
import { attendanceCorrectionApi } from '@/features/attendance/services/attendance-correction.api'
import { notificationService } from '@/features/notifications/services/notification.service'
import { format, isValid, parse } from 'date-fns'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { StatusDotBadge } from '@/components/tables'

const punchTimePattern = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i

export function AttendanceCorrectionPage({ employeeOnly = false, missingPunchMode = false }: { employeeOnly?: boolean; missingPunchMode?: boolean }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const employee = useCurrentEmployee()
  const rows = listAttendanceRows()
  const selectedRow = rows.find((row) => row.id === params.get('record'))
  const selected = employeeOnly && selectedRow && selectedRow.employeeId !== employee?.id && selectedRow.name.toLowerCase() !== `${employee?.firstName} ${employee?.lastName}`.toLowerCase() ? undefined : selectedRow
  const [corrections, setCorrections] = useState<AttendanceCorrectionRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [employeeName, setEmployeeName] = useState(employeeOnly && employee ? `${employee.firstName} ${employee.lastName}` : selected?.name ?? '')
  const [date, setDate] = useState(selected ? attendanceDateKey(selected) : '')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [reason, setReason] = useState('')
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatus, setRequestStatus] = useState('All status')
  const [appliedRequestSearch, setAppliedRequestSearch] = useState('')
  const [appliedRequestStatus, setAppliedRequestStatus] = useState('All status')
  const [activeRequest, setActiveRequest] = useState<AttendanceCorrectionRecord | null>(null)
  const [editingRequest, setEditingRequest] = useState<AttendanceCorrectionRecord | null>(null)
  const [editCheckIn, setEditCheckIn] = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')
  const [editReason, setEditReason] = useState('')
  useEffect(() => {
    let active = true
    void attendanceCorrectionApi.list().then((items) => {
      if (active) setCorrections(items)
    }).catch((error) => {
      if (active) toast.error(error instanceof Error ? error.message : 'Unable to load attendance correction requests.')
    })
    return () => { active = false }
  }, [])
  const decide = async (id: string, status: 'Approved' | 'Rejected') => {
    const target = corrections.find((item) => item.id === id)
    if (!target || busy) return
    setBusy(true)
    try {
      const decided = await attendanceCorrectionApi.decide(id, status)
    if (target && status === 'Approved' && target.employeeId) {
      const rows = listAttendanceRows()
      const linked = employeeStore.getById(target.employeeId)
      const dateKey = target.dateKey ?? (/^\d{4}-\d{2}-\d{2}$/.test(target.date) ? target.date : (() => { const parsed = new Date(target.date); return Number.isNaN(parsed.getTime()) ? '' : format(parsed, 'yyyy-MM-dd') })())
      const existing = rows.find((row) => row.id === target.attendanceRecordId || (row.employeeId === target.employeeId && attendanceDateKey(row) === dateKey))
      const parseTime = (value: string) => {
        if (!value || !dateKey) return undefined
        const parsed = parse(`${dateKey} ${value.trim()}`, 'yyyy-MM-dd hh:mm a', new Date())
        return isValid(parsed) ? parsed.toISOString() : undefined
      }
      const checkInAt = parseTime(target.checkIn) ?? existing?.checkInAt
      const checkOutAt = parseTime(target.checkOut) ?? existing?.checkOutAt
      if (linked && dateKey) {
        const displayDate = format(new Date(`${dateKey}T12:00:00`), 'MMM dd, yyyy')
        const corrected: ModuleRow = {
          ...(existing ?? { id: target.attendanceRecordId ?? `AT-${target.employeeId}-${dateKey.replaceAll('-', '')}`, name: `${linked.firstName} ${linked.lastName}`, department: linked.dept, date: displayDate, status: 'Present' }),
          employeeId: linked.id, name: `${linked.firstName} ${linked.lastName}`, department: linked.dept,
          detail: `${target.checkIn || target.existingCheckIn || '—'} — ${target.checkOut || target.existingCheckOut || '—'}`,
          date: displayDate, dateKey, ...(checkInAt ? { checkInAt } : {}), ...(checkOutAt ? { checkOutAt } : {}),
        }
        updateAttendanceRow(corrected)
      }
    }
    const next = corrections.map((item) => item.id === id ? decided : item)
    setCorrections(next)
    void notificationService.notifyAttendanceCorrectionStatus({ ...target, employeeId: target.employeeId ?? employeeStore.getSnapshot().find((item) => `${item.firstName} ${item.lastName}`.toLowerCase() === target.employee.toLowerCase())?.id }, status).catch(() => undefined)
    window.dispatchEvent(new Event('hrm:data-change'))
    toast.success(`Attendance correction ${status.toLowerCase()}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save the attendance correction decision.')
    } finally {
      setBusy(false)
    }
  }
  const beginEdit = (item: AttendanceCorrectionRecord) => {
    setEditingRequest(item)
    setEditCheckIn(item.checkIn ?? '')
    setEditCheckOut(item.checkOut ?? '')
    setEditReason(item.reason ?? '')
  }
  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingRequest || busy) return
    if ((!editCheckIn.trim() && !editCheckOut.trim()) || (editCheckIn.trim() && !punchTimePattern.test(editCheckIn.trim())) || (editCheckOut.trim() && !punchTimePattern.test(editCheckOut.trim()))) {
      toast.error('Enter at least one corrected time in hh:mm AM/PM format.')
      return
    }
    setBusy(true)
    try {
      const updated = await attendanceCorrectionApi.update(editingRequest.id, { checkIn: sanitizeText(editCheckIn), checkOut: sanitizeText(editCheckOut), reason: sanitizeText(editReason) })
      setCorrections((items) => items.map((item) => item.id === updated.id ? updated : item))
      setEditingRequest(null)
      window.dispatchEvent(new Event('hrm:data-change'))
      toast.success('Attendance correction updated.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update the attendance correction.')
    } finally { setBusy(false) }
  }

  if (!employeeOnly && !params.get('record')) {
    const visibleRequests = corrections.filter((item) => {
      const matchesStatus = appliedRequestStatus === 'All status' || item.status === appliedRequestStatus
      const haystack = `${item.employee} ${item.employeeId ?? ''} ${item.date} ${item.status}`.toLowerCase()
      return matchesStatus && haystack.includes(appliedRequestSearch.toLowerCase().trim())
    })
    if (missingPunchMode) return (
      <PageContainer>
        <PageHeader title="Missing Punch Requests" subtitle="Review employee missing punch requests and apply attendance corrections." />
        <section className="panel data-panel">
          <form className="attendance-missing-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedRequestSearch(requestSearch); setAppliedRequestStatus(requestStatus) }}>
            <input aria-label="Search employee, date or status" placeholder="Search employee, date or status" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} />
            <select aria-label="Filter request status" value={requestStatus} onChange={(event) => setRequestStatus(event.target.value)}>{['All status', 'Pending', 'Approved', 'Rejected'].map((item) => <option key={item}>{item}</option>)}</select>
            <button className="button primary" type="submit">Filter</button>
            <button className="button" type="button" onClick={() => { setRequestSearch(''); setRequestStatus('All status'); setAppliedRequestSearch(''); setAppliedRequestStatus('All status') }}>Reset</button>
          </form>
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Missing Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map((item) => {
                  const missingType = !item.existingCheckIn && !item.existingCheckOut ? 'Both' : !item.existingCheckIn || item.existingCheckIn === '—' ? 'Punch In' : !item.existingCheckOut || item.existingCheckOut === '—' ? 'Punch Out' : 'Both'
                  const employeeRecord = employeeStore.getById(item.employeeId ?? '')
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.employee}</TableCell>
                      <TableCell>{item.employeeId ?? '—'}</TableCell>
                      <TableCell>{employeeRecord?.dept ?? '—'}</TableCell>
                      <TableCell>{item.dateKey ?? item.date}</TableCell>
                      <TableCell>{missingType}</TableCell>
                      <TableCell><StatusDotBadge status={item.status} /></TableCell>
                      <TableCell>{item.submittedAt ? format(new Date(item.submittedAt), 'yyyy-MM-dd HH:mm') : '—'}</TableCell>
                      <TableCell><button className="attendance-view-link" onClick={() => setActiveRequest(item)}>View</button></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {!visibleRequests.length && <div className="empty-state"><b>No missing punch requests</b><span>Requests matching these filters will appear here.</span></div>}
          </div>
        </section>
        {activeRequest && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setActiveRequest(null)}><section className="modal-card attendance-request-modal" role="dialog" aria-modal="true" aria-labelledby="missing-request-title"><button className="modal-close" aria-label="Close request" onClick={() => setActiveRequest(null)}>×</button><h2 id="missing-request-title">Missing punch request</h2><dl><div><dt>Employee</dt><dd>{activeRequest.employee} · {activeRequest.employeeId ?? '—'}</dd></div><div><dt>Date</dt><dd>{activeRequest.dateKey ?? activeRequest.date}</dd></div><div><dt>Missing type</dt><dd>{!activeRequest.existingCheckIn && !activeRequest.existingCheckOut ? 'Both' : !activeRequest.existingCheckIn || activeRequest.existingCheckIn === '—' ? 'Punch In' : !activeRequest.existingCheckOut || activeRequest.existingCheckOut === '—' ? 'Punch Out' : 'Both'}</dd></div><div><dt>Existing punch</dt><dd>{activeRequest.existingCheckIn ?? '—'} – {activeRequest.existingCheckOut ?? '—'}</dd></div><div><dt>Requested punch</dt><dd>{activeRequest.checkIn || '—'} – {activeRequest.checkOut || '—'}</dd></div><div><dt>Reason</dt><dd>{activeRequest.reason}</dd></div><div><dt>Status</dt><dd>{activeRequest.status}</dd></div></dl>{activeRequest.status === 'Pending' && <div className="form-actions"><button className="button" disabled={busy} onClick={() => { void decide(activeRequest.id, 'Rejected').then(() => setActiveRequest(null)) }}>Reject</button><button className="button primary" disabled={busy} onClick={() => { void decide(activeRequest.id, 'Approved').then(() => setActiveRequest(null)) }}>Approve &amp; apply</button></div>}</section></div>}
      </PageContainer>
    )
    return (
      <PageContainer>
        <PageHeader title="Attendance corrections" subtitle="Review employee requests to correct their time records." actions={<button className="button" onClick={() => navigate('/app/attendance')}>Back to attendance</button>} />
        <section className="panel data-panel">
          <div className="panel-head">
            <div>
              <h2>Correction requests</h2>
              <span>{corrections.filter((item) => item.status === 'Pending').length} pending</span>
            </div>
          </div>
          <div className="table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Existing time</TableHead>
                  <TableHead>Requested time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.employee}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.existingCheckIn ?? '—'} – {item.existingCheckOut ?? '—'}</TableCell>
                    <TableCell>{item.checkIn || '—'} – {item.checkOut || '—'}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell><StatusDotBadge status={item.status} /></TableCell>
                    <TableCell>
                      <ActionDropdown label={`Actions for ${item.employee}'s correction`} actions={item.status === 'Pending' ? [
                        { label: 'Edit correction', onClick: () => beginEdit(item) },
                        { label: 'Approve', onClick: () => { void decide(item.id, 'Approved') } },
                        { label: 'Reject', destructive: true, onClick: () => { void decide(item.id, 'Rejected') } },
                      ] : [{ label: 'View correction', onClick: () => setActiveRequest(item) }]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!corrections.length && <div className="empty-state"><b>No correction requests</b><span>New employee correction requests will appear here.</span></div>}
          </div>
        </section>
        {editingRequest && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditingRequest(null)}><form className="modal-card attendance-request-modal" role="dialog" aria-modal="true" aria-labelledby="edit-correction-title" onSubmit={(event) => { void saveEdit(event) }}><button type="button" className="modal-close" aria-label="Close editor" onClick={() => setEditingRequest(null)}>×</button><h2 id="edit-correction-title">Edit attendance correction</h2><p>{editingRequest.employee} · {editingRequest.date}</p><label className="employee-field">Correct check-in<input value={editCheckIn} onChange={(event) => setEditCheckIn(event.target.value)} placeholder="09:00 AM" /></label><label className="employee-field">Correct check-out<input value={editCheckOut} onChange={(event) => setEditCheckOut(event.target.value)} placeholder="05:30 PM" /></label><label className="employee-field">Reason<textarea required minLength={10} maxLength={500} value={editReason} onChange={(event) => setEditReason(event.target.value)} /></label><div className="form-actions"><button type="button" className="button" disabled={busy} onClick={() => setEditingRequest(null)}>Cancel</button><button type="submit" className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save correction'}</button></div></form></div>}
        {activeRequest && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setActiveRequest(null)}><section className="modal-card attendance-request-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close request" onClick={() => setActiveRequest(null)}>×</button><h2>Attendance correction</h2><dl><div><dt>Employee</dt><dd>{activeRequest.employee}</dd></div><div><dt>Date</dt><dd>{activeRequest.date}</dd></div><div><dt>Requested punch</dt><dd>{activeRequest.checkIn || '—'} – {activeRequest.checkOut || '—'}</dd></div><div><dt>Reason</dt><dd>{activeRequest.reason}</dd></div><div><dt>Status</dt><dd>{activeRequest.status}</dd></div></dl></section></div>}
      </PageContainer>
    )
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      !attendanceSchema.safeParse({
        employeeName,
        department: selected?.department ?? 'General',
        checkIn,
        checkOut,
        status: selected?.status ?? 'Present',
      }).success
    ) {
      toast.error('Enter a valid employee name and attendance status.')
      return
    }
    const timePattern = /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i
    if ((!checkIn.trim() && !checkOut.trim()) || (checkIn.trim() && !timePattern.test(checkIn.trim())) || (checkOut.trim() && !timePattern.test(checkOut.trim()))) {
      toast.error('Enter at least one corrected time in hh:mm AM/PM format.')
      return
    }
    const record = {
      employee: sanitizeText(employeeName),
      date: sanitizeText(date),
      checkIn: sanitizeText(checkIn),
      checkOut: sanitizeText(checkOut),
      existingCheckIn: selected?.detail.split('—')[0]?.trim() ?? '—',
      existingCheckOut: selected?.detail.split('—')[1]?.trim() ?? '—',
      reason: sanitizeText(reason),
      attendanceRecordId: selected?.id,
      employeeId: selected?.employeeId ?? employeeStore.getSnapshot().find((employee) => `${employee.firstName} ${employee.lastName}`.toLowerCase() === employeeName.toLowerCase())?.id,
      ...(date.match(/^\d{4}-\d{2}-\d{2}$/) ? { dateKey: date } : {}),
    }
    const duplicate = corrections.some((item) => item.status === 'Pending' && item.employeeId === record.employeeId && (item.dateKey === record.dateKey || item.date === record.date))
    if (duplicate) { toast.error('A correction request is already pending for this employee and date.'); return }
    setBusy(true)
    try {
      const saved = await attendanceCorrectionApi.submit(record)
      if (employeeOnly) void notificationService.notifyAttendanceCorrectionSubmitted(saved).catch(() => undefined)
      setCorrections((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      window.dispatchEvent(new Event('hrm:data-change'))
      toast.success('Attendance correction submitted for review.')
      setReason('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit the attendance correction.')
    } finally {
      setBusy(false)
    }
  }

  const correctionForm = <form className="employee-form" onSubmit={submit}>
    <section className="card"><h2 className="section-title">Correction details</h2><div className="employee-form-grid">
      <div className="employee-field"><span>Existing check-in</span><input readOnly value={selected?.detail.split('—')[0]?.trim() ?? '—'} /></div>
      <div className="employee-field"><span>Existing check-out</span><input readOnly value={selected?.detail.split('—')[1]?.trim() ?? '—'} /></div>
      <label className="employee-field">Employee<input required value={employeeName} readOnly={employeeOnly} onChange={(event) => setEmployeeName(event.target.value)} /></label>
      <label className="employee-field">Attendance date<input required type="date" disabled={Boolean(selected)} value={date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : ''} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="employee-field">Correct check-in<input value={checkIn} onChange={(event) => setCheckIn(event.target.value)} placeholder="09:00 AM" /></label>
      <label className="employee-field">Correct check-out<input value={checkOut} onChange={(event) => setCheckOut(event.target.value)} placeholder="05:30 PM" /></label>
      <label className="employee-field employee-field--full">Reason<textarea required minLength={10} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this attendance record needs correction." /></label>
    </div></section><div className="form-actions"><button className="button primary" type="submit">Submit correction</button></div>
  </form>
  if (employeeOnly) {
    const ownRequests = corrections.filter((item) => item.employeeId === employee?.id)
    return <PageContainer>
      <PageHeader title="Attendance correction" subtitle="Request a correction and track its review status." />
      <section className="card employee-dashboard-card"><h2>My correction requests</h2><div className="table-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Requested time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ownRequests.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.checkIn || '—'} – {item.checkOut || '—'}</TableCell>
                <TableCell>{item.reason}</TableCell>
                <TableCell>
                  <StatusDotBadge status={item.status} />
                  {item.decisionAt && <small>{new Date(item.decisionAt).toLocaleDateString()}</small>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!ownRequests.length && <p className="empty-state">No correction requests yet.</p>}
      </div></section>
      {employee ? correctionForm : <section className="card employee-dashboard-card"><p className="empty-state">Link your employee profile before submitting an attendance correction.</p></section>}
    </PageContainer>
  }
  return <PageContainer><PageHeader title="Attendance correction" subtitle="Submit a check-in or check-out correction for review." />{correctionForm}</PageContainer>
}
