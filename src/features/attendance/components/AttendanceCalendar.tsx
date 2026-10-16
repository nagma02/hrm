import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  parse,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ModuleRow } from '@/features/shared/data/moduleData'

function dateFromRow(value: string) {
  const parsed = parse(value, 'MMM dd, yyyy', new Date())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function AttendanceCalendar({ rows }: { rows: ModuleRow[] }) {
  const [today, setToday] = useState(() => new Date())
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => new Date())

  useEffect(() => {
    const nextMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    const timer = window.setTimeout(() => {
      const nextToday = new Date()
      setToday(nextToday)
      setMonth(startOfMonth(nextToday))
      setSelected(nextToday)
    }, Math.max(0, nextMidnight.getTime() - Date.now()) + 50)

    return () => window.clearTimeout(timer)
  }, [today])

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  )
  const statusesFor = (day: Date) =>
    rows.filter((row) => {
      const date = dateFromRow(row.date)
      return date && isSameDay(date, day)
    })
  const selectedRows = statusesFor(selected)
  return (
    <section className="card attendance-calendar-card" aria-labelledby="attendance-calendar-title">
      <div className="attendance-section-heading">
        <div>
          <span className="eyebrow">TEAM CALENDAR</span>
          <h2 id="attendance-calendar-title">Attendance calendar</h2>
          <p>Select a date to review recorded attendance.</p>
        </div>
        <div className="calendar-month-controls">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonth((value) => subMonths(value, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <strong>{format(month, 'MMMM yyyy')}</strong>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth((value) => addMonths(value, 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="attendance-calendar-grid" role="grid" aria-label={format(month, 'MMMM yyyy')}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span className="calendar-weekday" role="columnheader" key={day}>
            {day}
          </span>
        ))}
        {days.map((day) => {
          const records = statusesFor(day)
          const status = records.some((row) => row.status === 'Absent')
            ? 'absent'
            : records.some((row) => row.status === 'Late')
              ? 'late'
              : records.some((row) => row.status === 'On Leave')
                ? 'leave'
                : records.some((row) => row.status === 'Present')
                  ? 'present'
                  : ''
          return (
            <button
              type="button"
              role="gridcell"
              aria-label={`${format(day, 'MMMM d')}${status ? `, ${status} records` : ''}`}
              aria-pressed={isSameDay(day, selected)}
              key={day.toISOString()}
              disabled={!isSameMonth(day, month)}
              className={`calendar-day${isSameMonth(day, month) ? '' : ' is-outside'}${isSameDay(day, selected) ? ' is-selected' : ''}`}
              onClick={() => setSelected(day)}
            >
              {format(day, 'd')}
              {status && <i className={`calendar-day-dot calendar-day-dot--${status}`} />}
            </button>
          )
        })}
      </div>
      <div className="attendance-calendar-footer">
        <div className="calendar-legend">
          <span>
            <i className="calendar-day-dot--present" />
            Present
          </span>
          <span>
            <i className="calendar-day-dot--late" />
            Late
          </span>
          <span>
            <i className="calendar-day-dot--absent" />
            Absent
          </span>
          <span>
            <i className="calendar-day-dot--leave" />
            Leave
          </span>
        </div>
        <div className="calendar-selected-summary">
          <strong>{format(selected, 'EEE, dd MMM')}</strong>
          <span>
            {selectedRows.length
              ? `${selectedRows.length} attendance record${selectedRows.length === 1 ? '' : 's'}`
              : 'No attendance records'}
          </span>
        </div>
      </div>
    </section>
  )
}
