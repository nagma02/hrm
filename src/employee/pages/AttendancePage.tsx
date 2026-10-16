import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, Check, ChevronLeft, ChevronRight, LogIn, LogOut, PencilLine, Timer } from 'lucide-react'
import { toast } from 'sonner'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import { attendanceDateKey, listAttendanceRows, recordEmployeeClockIn, recordEmployeeClockOut, listAttendanceCorrections, type AttendanceCorrectionRecord } from '@/features/attendance/services/attendance.service'
import { attendanceCorrectionApi } from '@/features/attendance/services/attendance-correction.api'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { capturePunchLocation, compressPunchPhoto } from '@/features/attendance/services/attendance-proof'
import { PunchLocationCell, PunchPhotoCell } from '@/features/attendance/components/PunchProofCells'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { notificationService } from '@/features/notifications/services/notification.service'

const currentKey = () => format(new Date(), 'yyyy-MM-dd')
const statusClass = (status: string) => `status-${status.toLowerCase().replaceAll(' ', '-')}`
const timeText = (value?: string) => value ? format(new Date(value), 'hh:mm a') : '—'
const hoursText = (row?: ModuleRow) => row?.checkInAt && row.checkOutAt ? `${((new Date(row.checkOutAt).getTime() - new Date(row.checkInAt).getTime() - (row.breakMinutes ?? 0) * 60_000) / 3_600_000).toFixed(1)} hrs` : row?.checkInAt ? 'In progress' : '—'
const elapsed = (row?: ModuleRow, now = Date.now()) => row?.checkInAt ? Math.max(0, Math.floor(((row.checkOutAt ? new Date(row.checkOutAt).getTime() : now) - new Date(row.checkInAt).getTime() - (row.breakMinutes ?? 0) * 60_000) / 1000)) : 0
const duration = (seconds: number) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
const prettyDate = (key: string) => { try { return format(parseISO(key), 'MMM d, yyyy') } catch { return key } }

export default function AttendancePage() {
  const { employee } = useEmployeeRecord()
  const revision = useHRMDataChange()
  const [now, setNow] = useState(Date.now())
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [page, setPage] = useState(1)
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctionDate, setCorrectionDate] = useState(currentKey())
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [reason, setReason] = useState('')
  const punchPhotoInput = useRef<HTMLInputElement>(null)
  const [pendingPunchLocation, setPendingPunchLocation] = useState<Awaited<ReturnType<typeof capturePunchLocation>>>()
  const [corrections, setCorrections] = useState<AttendanceCorrectionRecord[]>(() => listAttendanceCorrections())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { setCorrections(listAttendanceCorrections()) }, [revision])
  const dateKey = currentKey()
  const allRows = useMemo(() => employee ? listAttendanceRows().filter((row) => row.employeeId === employee.id) : [], [employee, revision])
  const todayRows = allRows.filter((row) => attendanceDateKey(row) === dateKey).sort((left, right) => (right.checkInAt ? new Date(right.checkInAt).getTime() : 0) - (left.checkInAt ? new Date(left.checkInAt).getTime() : 0))
  const todayRow = todayRows.find((row) => row.checkInAt && !row.checkOutAt) ?? todayRows[0]
  const todayMonthRows = allRows.filter((row) => attendanceDateKey(row).startsWith(format(new Date(year, month, 1), 'yyyy-MM')))
  const monthRows = [...todayMonthRows].sort((left, right) => attendanceDateKey(right).localeCompare(attendanceDateKey(left)))
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(monthRows.length / pageSize))
  const visibleRows = monthRows.slice((page - 1) * pageSize, page * pageSize)
  const stat = (status: string) => todayMonthRows.filter((row) => row.status === status || (status === 'Leave' && row.status === 'On Leave')).length
  const ownCorrections = corrections.filter((item) => item.employeeId === employee?.id)
  const overtimeHours = employee ? payrollService.list().find((item) => item.employeeId === employee.id)?.overtimeHours : undefined

  const punch = async (photo?: File) => {
    if (!employee) return
    const existing = listAttendanceRows().find((row) => row.employeeId === employee.id && attendanceDateKey(row) === dateKey && row.checkInAt && !row.checkOutAt)
    if (!existing) {
      if (!photo) {
        if (!pendingPunchLocation) {
          try {
            const location = await capturePunchLocation()
            setPendingPunchLocation(location)
            toast.success('Current location captured. Click again to add your punch photo.')
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to capture your current location.')
          }
        } else {
          punchPhotoInput.current?.click()
        }
        return
      }
      try {
        const image = await compressPunchPhoto(photo)
        recordEmployeeClockIn(employee, Date.now(), { location: pendingPunchLocation, photo: image })
        setPendingPunchLocation(undefined)
        toast.success('Check-in saved with photo and GPS location.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to save your check-in.')
      } finally {
        if (punchPhotoInput.current) punchPhotoInput.current.value = ''
      }
    } else {
      recordEmployeeClockOut(employee, existing.checkInAt ? new Date(existing.checkInAt).getTime() : Date.now(), Date.now())
      toast.success('You are checked out. The timestamp was recorded.')
    }
  }
  const changeMonth = (delta: number) => { const next = new Date(year, month + delta, 1); setMonth(next.getMonth()); setYear(next.getFullYear()); setPage(1) }
  const submitCorrection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employee) return
    if (!checkIn && !checkOut) { toast.error('Enter at least one corrected time.'); return }
    const dateRow = allRows.find((row) => attendanceDateKey(row) === correctionDate)
    const toAmPm = (value: string) => value ? format(new Date(`${correctionDate}T${value}:00`), 'hh:mm a') : ''
    const request = {
      employee: `${employee.firstName} ${employee.lastName}`, employeeId: employee.id, date: prettyDate(correctionDate), dateKey: correctionDate,
      checkIn: toAmPm(checkIn), checkOut: toAmPm(checkOut), reason: reason.trim(), existingCheckIn: timeText(dateRow?.checkInAt), existingCheckOut: timeText(dateRow?.checkOutAt), attendanceRecordId: dateRow?.id,
    }
    if (request.reason.length < 10) { toast.error('Please provide at least 10 characters explaining the correction.'); return }
    if (ownCorrections.some((item) => item.status === 'Pending' && item.dateKey === correctionDate)) { toast.error('A correction request for that date is already pending.'); return }
    try {
      const saved = await attendanceCorrectionApi.submit(request)
      void notificationService.notifyAttendanceCorrectionSubmitted(saved).catch(() => undefined)
      setCorrections((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setShowCorrection(false); setReason(''); setCheckIn(''); setCheckOut('')
      toast.success('Correction request sent to the admin review queue.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to submit the correction request.') }
  }

  return <PageContainer>
    <PageHeader title="My attendance" subtitle="Punch in, review your timesheet, and request corrections." actions={<button className="button" type="button" onClick={() => setShowCorrection(true)}><PencilLine size={15} /> Request correction</button>} />
    <section className="employee-punch-card"><div><span className="eyebrow">TODAY · {employee?.shift ?? 'Assigned shift'}</span><h2>{format(new Date(now), 'hh:mm:ss a')}</h2><p>{todayRow?.checkInAt ? todayRow.checkOutAt ? 'Checked out · You can punch in again anytime' : `Checked in at ${timeText(todayRow.checkInAt)}` : 'You are not checked in yet'}</p></div><div className="employee-punch-elapsed"><span><Timer size={16} /> Working time</span><strong>{todayRow?.checkInAt && !todayRow.checkOutAt ? duration(elapsed(todayRow, now)) : '0h 0m'}</strong></div><div className="employee-punch-action"><button type="button" disabled={!employee} className="button primary" onClick={() => void punch()}>{todayRow?.checkInAt && !todayRow.checkOutAt ? <><LogOut size={16} /> Check out</> : pendingPunchLocation ? <><LogIn size={16} /> Add photo &amp; check in</> : <><LogIn size={16} /> Get location</>}</button>{(!todayRow?.checkInAt || todayRow.checkOutAt) && <small>{pendingPunchLocation ? `Location captured (${pendingPunchLocation.latitude.toFixed(5)}, ${pendingPunchLocation.longitude.toFixed(5)}). Click to add your punch photo.` : 'Click to allow location access. Then add your punch photo.'}</small>}<input ref={punchPhotoInput} className="sr-only" type="file" accept="image/*" capture="user" aria-label="Take or upload a check-in photo" onChange={(event) => { const photo = event.currentTarget.files?.[0]; if (photo) void punch(photo); else toast.info('Check-in cancelled. Select a photo to continue.') }} /></div></section>
    <section className="employee-attendance-stats">{[['Present', stat('Present')], ['Late', stat('Late')], ['Absent', stat('Absent')], ['Leave', stat('Leave')]].map(([label, value]) => <article className="card employee-attendance-stat" key={label}><span>{label}</span><strong>{value}</strong><small>This month</small></article>)}</section>
    <section className="card employee-data-card"><header className="employee-data-toolbar"><div><span className="eyebrow">TIMESHEET</span><h2>Monthly attendance</h2><p>{monthRows.length} record(s) · check-in/out timestamps and daily status</p></div><div className="employee-month-controls"><button className="button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button><strong>{format(new Date(year, month, 1), 'MMMM yyyy')}</strong><button className="button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={16} /></button><select aria-label="Choose year" value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1) }}>{[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((value) => <option key={value}>{value}</option>)}</select></div></header>
      <div className="table-scroll"><table className="hr-table employee-attendance-table"><thead><tr><th>#</th><th>Name</th><th>Dept</th><th>Date</th><th>Punch in / out</th><th>Total hours</th><th>OT</th><th>Status</th><th>View loca.</th><th>View img</th></tr></thead><tbody>{visibleRows.map((row, index) => { const key = attendanceDateKey(row); return <tr key={row.id}><td>{(page - 1) * pageSize + index + 1}</td><td><strong>{employee ? `${employee.firstName} ${employee.lastName}` : '—'}</strong></td><td>{employee?.dept ?? '—'}</td><td>{prettyDate(key)}<small>{format(parseISO(key), 'EEEE')}</small></td><td><div className="attendance-punch-times"><span>Punch In: {timeText(row.checkInAt)}</span><small>Punch Out: {timeText(row.checkOutAt)}</small></div></td><td>{hoursText(row)}</td><td>{overtimeHours !== undefined ? `${overtimeHours}h` : '—'}</td><td><span className={`status-pill ${statusClass(row.status === 'On Leave' ? 'leave' : row.status)}`}><i />{row.status === 'On Leave' ? 'Leave' : row.status}</span></td><td><PunchLocationCell location={row.punchLocation} /></td><td><PunchPhotoCell photo={row.punchPhoto} name={employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'} /></td></tr> })}{!visibleRows.length && <tr><td colSpan={10}><div className="employee-empty-state"><CalendarDays /><h3>No attendance records for this month</h3><p>Check another month or check in to create today’s record.</p></div></td></tr>}</tbody></table></div>
      <div className="employee-table-pagination"><span>Page {page} of {pageCount}</span><div><button className="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button className="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></div>
    </section>
    <section className="card employee-data-card"><header className="employee-card-heading"><div><span className="eyebrow">REQUESTS</span><h2>Correction history</h2></div><span className="badge badge--info">{ownCorrections.filter((item) => item.status === 'Pending').length} pending</span></header><div className="table-scroll"><table className="hr-table"><thead><tr><th>Date</th><th>Requested times</th><th>Reason</th><th>Status</th><th>Admin remarks</th></tr></thead><tbody>{ownCorrections.map((item) => <tr key={item.id}><td>{item.date}</td><td>{item.checkIn || '—'} – {item.checkOut || '—'}</td><td>{item.reason}</td><td><span className={`status-pill ${statusClass(item.status)}`}><i />{item.status}</span></td><td>{item.decisionComment || '—'}</td></tr>)}{!ownCorrections.length && <tr><td colSpan={5}>No correction requests yet.</td></tr>}</tbody></table></div></section>
    {showCorrection && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowCorrection(false)}><form className="form-modal" onSubmit={submitCorrection} role="dialog" aria-modal="true" aria-labelledby="correction-title"><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowCorrection(false)}>×</button><p className="eyebrow">ATTENDANCE</p><h2 id="correction-title">Request correction</h2><label>Date<input type="date" required max={currentKey()} value={correctionDate} onChange={(event) => setCorrectionDate(event.target.value)} /></label><div className="employee-form-grid"><label>Correct check-in<input type="time" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} /></label><label>Correct check-out<input type="time" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label></div><label>Reason<textarea required minLength={10} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us what needs correcting." /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setShowCorrection(false)}>Cancel</button><button type="submit" className="button primary"><Check size={15} /> Submit request</button></div></form></div>}
  </PageContainer>
}
