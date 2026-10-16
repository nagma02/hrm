import { useEffect, useRef, useState } from 'react'
import { Camera, Clock3, MapPin } from 'lucide-react'
import { useAuth } from '@/app/providers/use-auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEmployeeDisplayName } from '@/features/employees/utils/employee-identity'
import { recordEmployeeClockIn, recordEmployeeClockOut } from '../services/attendance.service'
import { capturePunchLocation, compressPunchPhoto } from '../services/attendance-proof'

function readClockIn(storageKey: string) {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null
    const timestamp = Number(stored)
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null
  } catch {
    return null
  }
}

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const remaining = (seconds % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}:${remaining}`
}

export default function AttendanceClockWidget({ employeeMode = false }: { employeeMode?: boolean }) {
  const { user } = useAuth()
  const { name, employee } = useEmployeeDisplayName()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [punchMessage, setPunchMessage] = useState('')
  const canRecordAttendance = !employeeMode || Boolean(employee)
  const storageKey = `hrm-attendance-clock-in:${employee?.id ?? user?.email?.trim().toLowerCase() ?? 'demo'}`
  const [clockIn, setClockIn] = useState<number | null>(() => readClockIn(storageKey))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!clockIn) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [clockIn])

  useEffect(() => {
    const syncClock = () => {
      setClockIn(readClockIn(storageKey))
      setNow(Date.now())
    }
    const syncStorage = (event: StorageEvent) => {
      if (event.key === storageKey) syncClock()
    }
    window.addEventListener('hrm:attendance-clock-change', syncClock)
    window.addEventListener('storage', syncStorage)
    return () => {
      window.removeEventListener('hrm:attendance-clock-change', syncClock)
      window.removeEventListener('storage', syncStorage)
    }
  }, [storageKey])

  const toggleClock = async (photo?: File) => {
    try {
      if (clockIn) {
        const endedAt = Date.now()
        localStorage.setItem(
          `hrm-attendance-last-shift-seconds:${user?.email ?? 'demo'}`,
          String(Math.max(0, Math.floor((endedAt - clockIn) / 1000))),
        )
        if (employee) recordEmployeeClockOut(employee, clockIn, endedAt)
        localStorage.removeItem(storageKey)
        setClockIn(null)
        setNow(endedAt)
        window.dispatchEvent(new Event('hrm:attendance-clock-change'))
        toast.success('You are clocked out. Your attendance record was saved.')
        return
      }
      if (!photo && employeeMode) {
        photoInputRef.current?.click()
        return
      }
      const started = Date.now()
      const [location, image] = await Promise.all([
        capturePunchLocation(),
        photo ? compressPunchPhoto(photo) : Promise.resolve(undefined),
      ])
      localStorage.setItem(storageKey, String(started))
      if (employee) recordEmployeeClockIn(employee, started, { location, ...(image ? { photo: image } : {}) })
      setClockIn(started)
      setNow(started)
      window.dispatchEvent(new Event('hrm:attendance-clock-change'))
      toast.success('You are clocked in.')
      setPunchMessage(location ? 'Location and photo saved with this punch.' : 'Photo saved. Location was unavailable.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save your attendance. Please try again.')
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  return (
    <section className="card attendance-clock-widget" aria-label="Clock in and out">
      <div className="attendance-clock-icon">
        <Clock3 size={19} />
      </div>
      <div className="attendance-clock-copy">
        <span>TIME TRACKING</span>
        <strong>
          {clockIn ? durationLabel(Math.floor((now - clockIn) / 1000)) : 'Not clocked in'}
        </strong>
        <small>
          {clockIn
            ? `Since ${new Date(clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : `Ready for ${name}`}
        </small>
      </div>
      <Button variant={clockIn ? 'outline' : 'primary'} className={clockIn ? 'attendance-clock-out' : ''} onClick={() => void toggleClock()} disabled={!canRecordAttendance}>
        {employeeMode ? (clockIn ? 'Punch out' : 'Punch in') : (clockIn ? 'Clock out' : 'Clock in')}
      </Button>
      <input
        ref={photoInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="user"
        aria-label="Take a punch-in photo"
        onChange={(event) => {
          const photo = event.currentTarget.files?.[0]
          if (photo) void toggleClock(photo)
          else setPunchMessage('Punch-in cancelled. Take a photo to record your punch.')
        }}
      />
      {employeeMode && !clockIn && <small className="attendance-punch-proof"><Camera size={13} /> Photo and location are saved with punch-in</small>}
      {punchMessage && <small className="attendance-punch-proof"><MapPin size={13} /> {punchMessage}</small>}
      {employeeMode && !employee && <small className="employee-portal-note">Link your employee profile before recording attendance.</small>}
    </section>
  )
}
