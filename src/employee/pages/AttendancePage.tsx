import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, Check, ChevronLeft, ChevronRight, LogIn, LogOut, PencilLine, Timer } from 'lucide-react'
import { toast } from 'sonner'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import {
  attendanceDateKey,
  listAttendanceRows,
  recordEmployeeClockIn,
  recordEmployeeClockOut,
  listAttendanceCorrections,
  type AttendanceCorrectionRecord,
} from '@/features/attendance/services/attendance.service'
import { attendanceCorrectionApi } from '@/features/attendance/services/attendance-correction.api'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { capturePunchLocation, compressPunchPhoto } from '@/features/attendance/services/attendance-proof'
import { PunchLocationCell, PunchPhotoCell } from '@/features/attendance/components/PunchProofCells'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { notificationService } from '@/features/notifications/services/notification.service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableFilterTabs, TablePagination, StatusDotBadge } from '@/components/tables'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'

const currentKey = () => format(new Date(), 'yyyy-MM-dd')
const statusClass = (status: string) => `status-${status.toLowerCase().replaceAll(' ', '-')}`
const timeText = (value?: string) => (value ? format(new Date(value), 'hh:mm a') : '—')
const hoursText = (row?: ModuleRow) =>
  row?.checkInAt && row.checkOutAt
    ? `${(
        (new Date(row.checkOutAt).getTime() -
          new Date(row.checkInAt).getTime() -
          (row.breakMinutes ?? 0) * 60_000) /
        3_600_000
      ).toFixed(1)} hrs`
    : row?.checkInAt
      ? 'In progress'
      : '—'
const elapsed = (row?: ModuleRow, now = Date.now()) =>
  row?.checkInAt
    ? Math.max(
        0,
        Math.floor(
          ((row.checkOutAt ? new Date(row.checkOutAt).getTime() : now) -
            new Date(row.checkInAt).getTime() -
            (row.breakMinutes ?? 0) * 60_000) /
            1000
        )
      )
    : 0
const duration = (seconds: number) =>
  `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
const prettyDate = (key: string) => {
  try {
    return format(parseISO(key), 'MMM d, yyyy')
  } catch {
    return key
  }
}

export default function AttendancePage() {
  const { employee } = useEmployeeRecord()
  const revision = useHRMDataChange()
  const [now, setNow] = useState(Date.now())
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctionDate, setCorrectionDate] = useState(currentKey())
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [reason, setReason] = useState('')
  const punchPhotoInput = useRef<HTMLInputElement>(null)
  const [pendingPunchLocation, setPendingPunchLocation] =
    useState<Awaited<ReturnType<typeof capturePunchLocation>>>()
  const [corrections, setCorrections] = useState<AttendanceCorrectionRecord[]>(() =>
    listAttendanceCorrections()
  )

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setCorrections(listAttendanceCorrections())
  }, [revision])

  const dateKey = currentKey()
  const allRows = useMemo(
    () =>
      employee
        ? listAttendanceRows().filter((row) => row.employeeId === employee.id)
        : [],
    [employee, revision]
  )
  const todayRows = allRows
    .filter((row) => attendanceDateKey(row) === dateKey)
    .sort(
      (left, right) =>
        (right.checkInAt ? new Date(right.checkInAt).getTime() : 0) -
        (left.checkInAt ? new Date(left.checkInAt).getTime() : 0)
    )
  const todayRow =
    todayRows.find((row) => row.checkInAt && !row.checkOutAt) ?? todayRows[0]
  const todayMonthRows = allRows.filter((row) =>
    attendanceDateKey(row).startsWith(format(new Date(year, month, 1), 'yyyy-MM'))
  )
  const monthRows = [...todayMonthRows].sort((left, right) =>
    attendanceDateKey(right).localeCompare(attendanceDateKey(left))
  )
  const pageSize = 10
  const filteredMonthRows = activeTab === 'all'
    ? monthRows
    : monthRows.filter(row => activeTab === 'Leave' ? (row.status === 'Leave' || row.status === 'On Leave') : row.status === activeTab)
  const pageCount = Math.max(1, Math.ceil(filteredMonthRows.length / pageSize))
  const visibleRows = filteredMonthRows.slice((page - 1) * pageSize, page * pageSize)
  const stat = (status: string) =>
    todayMonthRows.filter(
      (row) => row.status === status || (status === 'Leave' && row.status === 'On Leave')
    ).length
  const ownCorrections = corrections.filter((item) => item.employeeId === employee?.id)
  const overtimeHours = employee
    ? payrollService.list().find((item) => item.employeeId === employee.id)?.overtimeHours
    : undefined

  const punch = async (photo?: File) => {
    if (!employee) return
    const existing = listAttendanceRows().find(
      (row) =>
        row.employeeId === employee.id &&
        attendanceDateKey(row) === dateKey &&
        row.checkInAt &&
        !row.checkOutAt
    )
    if (!existing) {
      if (!photo) {
        if (!pendingPunchLocation) {
          try {
            const location = await capturePunchLocation()
            setPendingPunchLocation(location)
            toast.success('Current location captured. Click again to add your punch photo.')
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : 'Unable to capture your current location.'
            )
          }
        } else {
          punchPhotoInput.current?.click()
        }
        return
      }
      try {
        const image = await compressPunchPhoto(photo)
        recordEmployeeClockIn(employee, Date.now(), {
          location: pendingPunchLocation,
          photo: image,
        })
        setPendingPunchLocation(undefined)
        toast.success('Check-in saved with photo and GPS location.')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Unable to save your check-in.'
        )
      } finally {
        if (punchPhotoInput.current) punchPhotoInput.current.value = ''
      }
    } else {
      recordEmployeeClockOut(
        employee,
        existing.checkInAt ? new Date(existing.checkInAt).getTime() : Date.now(),
        Date.now()
      )
      toast.success('You are checked out. The timestamp was recorded.')
    }
  }

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setMonth(next.getMonth())
    setYear(next.getFullYear())
    setPage(1)
  }

  const submitCorrection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employee) return
    if (!checkIn && !checkOut) {
      toast.error('Enter at least one corrected time.')
      return
    }
    const dateRow = allRows.find((row) => attendanceDateKey(row) === correctionDate)
    const toAmPm = (value: string) =>
      value ? format(new Date(`${correctionDate}T${value}:00`), 'hh:mm a') : ''
    const request = {
      employee: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.id,
      date: prettyDate(correctionDate),
      dateKey: correctionDate,
      checkIn: toAmPm(checkIn),
      checkOut: toAmPm(checkOut),
      reason: reason.trim(),
      existingCheckIn: timeText(dateRow?.checkInAt),
      existingCheckOut: timeText(dateRow?.checkOutAt),
      attendanceRecordId: dateRow?.id,
    }
    if (request.reason.length < 10) {
      toast.error('Please provide at least 10 characters explaining the correction.')
      return
    }
    if (
      ownCorrections.some(
        (item) => item.status === 'Pending' && item.dateKey === correctionDate
      )
    ) {
      toast.error('A correction request for that date is already pending.')
      return
    }
    try {
      const saved = await attendanceCorrectionApi.submit(request)
      void notificationService
        .notifyAttendanceCorrectionSubmitted(saved)
        .catch(() => undefined)
      setCorrections((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      setShowCorrection(false)
      setReason('')
      setCheckIn('')
      setCheckOut('')
      toast.success('Correction request sent to the admin review queue.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to submit the correction request.'
      )
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="My attendance"
        subtitle="Punch in, review your timesheet, and request corrections."
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => setShowCorrection(true)}
            className="gap-2"
          >
            <PencilLine size={15} />
            Request correction
          </Button>
        }
      />

      {/* Punch Section */}
      <section className="employee-punch-card">
        <div>
          <span className="eyebrow">TODAY · {employee?.shift ?? 'Assigned shift'}</span>
          <h2>{format(new Date(now), 'hh:mm:ss a')}</h2>
          <p>
            {todayRow?.checkInAt
              ? todayRow.checkOutAt
                ? 'Checked out · You can punch in again anytime'
                : `Checked in at ${timeText(todayRow.checkInAt)}`
              : 'You are not checked in yet'}
          </p>
        </div>
        <div className="employee-punch-elapsed">
          <span>
            <Timer size={16} /> Working time
          </span>
          <strong>
            {todayRow?.checkInAt && !todayRow.checkOutAt
              ? duration(elapsed(todayRow, now))
              : '0h 0m'}
          </strong>
        </div>
        <div className="employee-punch-action">
          <Button
            type="button"
            disabled={!employee}
            variant="default"
            className="gap-2"
            onClick={() => void punch()}
          >
            {todayRow?.checkInAt && !todayRow.checkOutAt ? (
              <>
                <LogOut size={16} /> Check out
              </>
            ) : pendingPunchLocation ? (
              <>
                <LogIn size={16} /> Add photo &amp; check in
              </>
            ) : (
              <>
                <LogIn size={16} /> Get location
              </>
            )}
          </Button>
          {(!todayRow?.checkInAt || todayRow.checkOutAt) && (
            <small>
              {pendingPunchLocation
                ? `Location captured (${pendingPunchLocation.latitude.toFixed(5)}, ${pendingPunchLocation.longitude.toFixed(5)}). Click to add your punch photo.`
                : 'Click to allow location access. Then add your punch photo.'}
            </small>
          )}
          <input
            ref={punchPhotoInput}
            className="sr-only"
            type="file"
            accept="image/*"
            capture="user"
            aria-label="Take or upload a check-in photo"
            onChange={(event) => {
              const photo = event.currentTarget.files?.[0]
              if (photo) void punch(photo)
              else toast.info('Check-in cancelled. Select a photo to continue.')
            }}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="employee-attendance-stats">
        {[
          ['Present', stat('Present')],
          ['Late', stat('Late')],
          ['Absent', stat('Absent')],
          ['Leave', stat('Leave')],
        ].map(([label, value]) => (
          <article className="card employee-attendance-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>This month</small>
          </article>
        ))}
      </section>

      {/* Timesheet Table Section (shadcn Table) */}
      <TableFilterTabs
        tabs={[
          { id: 'all', label: 'All', count: todayMonthRows.length },
          { id: 'Present', label: 'Present', count: stat('Present') },
          { id: 'Late', label: 'Late', count: stat('Late') },
          { id: 'Absent', label: 'Absent', count: stat('Absent') },
          { id: 'Leave', label: 'Leave', count: stat('Leave') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => { setActiveTab(id); setPage(1) }}
      />
      <section className="card employee-data-card">
        <header className="employee-data-toolbar">
          <div>
            <span className="eyebrow">TIMESHEET</span>
            <h2>Monthly attendance</h2>
            <p>
              {monthRows.length} record(s) · check-in/out timestamps and daily status
            </p>
          </div>
          <div className="employee-month-controls flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <strong>{format(new Date(year, month, 1), 'MMMM yyyy')}</strong>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={16} />
            </Button>
            <ToolbarSelect
              ariaLabel="Choose year"
              value={String(year)}
              onValueChange={(value) => {
                setYear(Number(value))
                setPage(1)
              }}
              options={[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((item) => ({ label: String(item), value: String(item) }))}
            />
          </div>
        </header>

        <div className="table-scroll">
          <Table className="hr-table employee-attendance-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Punch in / out</TableHead>
                <TableHead>Total hours</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>View loca.</TableHead>
                <TableHead>View img</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, index) => {
                const key = attendanceDateKey(row)
                return (
                  <TableRow key={row.id}>
                    <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>
                      <strong>
                        {employee ? `${employee.firstName} ${employee.lastName}` : '—'}
                      </strong>
                    </TableCell>
                    <TableCell>{employee?.dept ?? '—'}</TableCell>
                    <TableCell>
                      <div>
                        {prettyDate(key)}
                        <small className="block text-xs text-muted-foreground">
                          {format(parseISO(key), 'EEEE')}
                        </small>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="attendance-punch-times">
                        <span>Punch In: {timeText(row.checkInAt)}</span>
                        <small className="block text-xs text-muted-foreground">
                          Punch Out: {timeText(row.checkOutAt)}
                        </small>
                      </div>
                    </TableCell>
                    <TableCell>{hoursText(row)}</TableCell>
                    <TableCell>{overtimeHours !== undefined ? `${overtimeHours}h` : '—'}</TableCell>
                    <TableCell>
                      <StatusDotBadge status={row.status === 'On Leave' ? 'Leave' : row.status} />
                    </TableCell>
                    <TableCell>
                      <PunchLocationCell location={row.punchLocation} />
                    </TableCell>
                    <TableCell>
                      <PunchPhotoCell
                        photo={row.punchPhoto}
                        name={employee ? `${employee.firstName} ${employee.lastName}` : 'Employee'}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
              {!visibleRows.length && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="employee-empty-state flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <CalendarDays className="h-10 w-10 mb-2 opacity-50" />
                      <h3 className="font-semibold text-foreground">No attendance records for this month</h3>
                      <p className="text-sm">Check another month or check in to create today’s record.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="employee-table-pagination flex items-center justify-between p-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      {/* Correction History Table Section (shadcn Table) */}
      <section className="card employee-data-card">
        <header className="employee-card-heading flex items-center justify-between p-4">
          <div>
            <span className="eyebrow">REQUESTS</span>
            <h2 className="text-lg font-semibold">Correction history</h2>
          </div>
          <Badge variant="info">
            {ownCorrections.filter((item) => item.status === 'Pending').length} pending
          </Badge>
        </header>
        <div className="table-scroll">
          <Table className="hr-table">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Requested times</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admin remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownCorrections.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    {item.checkIn || '—'} – {item.checkOut || '—'}
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>
                    <span className={`status-pill ${statusClass(item.status)}`}>
                      <i />
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>{item.decisionComment || '—'}</TableCell>
                </TableRow>
              ))}
              {!ownCorrections.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-6 text-muted-foreground">
                    No correction requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Modal for Correction */}
      {showCorrection && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setShowCorrection(false)}
        >
          <form
            className="form-modal"
            onSubmit={submitCorrection}
            role="dialog"
            aria-modal="true"
            aria-labelledby="correction-title"
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setShowCorrection(false)}
            >
              ×
            </button>
            <p className="eyebrow">ATTENDANCE</p>
            <h2 id="correction-title">Request correction</h2>
            <label>
              Date
              <input
                type="date"
                required
                max={currentKey()}
                value={correctionDate}
                onChange={(event) => setCorrectionDate(event.target.value)}
              />
            </label>
            <div className="employee-form-grid">
              <label>
                Correct check-in
                <input
                  type="time"
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </label>
              <label>
                Correct check-out
                <input
                  type="time"
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </label>
            </div>
            <label>
              Reason
              <textarea
                required
                minLength={10}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Tell us what needs correcting."
              />
            </label>
            <div className="modal-actions flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCorrection(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" className="gap-1.5">
                <Check size={15} /> Submit request
              </Button>
            </div>
          </form>
        </div>
      )}
    </PageContainer>
  )
}
