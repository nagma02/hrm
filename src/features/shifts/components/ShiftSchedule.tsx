import { Clock3 } from 'lucide-react'
import type { ModuleRow } from '@/features/shared/data/moduleData'

const shiftRules: Record<string, { breakDuration: string; grace: string; days: string; overtime: string }> = {
  'SH-01': { breakDuration: '60 min break', grace: '10 min grace', days: 'Mon–Fri', overtime: '1.5× after scheduled hours' },
  'SH-02': { breakDuration: '60 min break', grace: '15 min grace', days: 'Mon–Fri', overtime: '1.5× after scheduled hours' },
}

function toMinutes(value: string) {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return null
  let hours = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hours += 12
  return hours * 60 + Number(match[2])
}

function shiftHours(value?: string) {
  if (typeof value !== 'string') return { start: null, end: null }

  const normalized = value.trim()
  if (!normalized) return { start: null, end: null }

  const [startText, endText] = normalized.replace(/–/g, '—').split('—').map((part) => part.trim())
  if (!startText || !endText) return { start: null, end: null }

  return { start: toMinutes(startText), end: toMinutes(endText) }
}

export default function ShiftSchedule({ rows }: { rows: ModuleRow[] }) {
  const rangeStart = 6 * 60
  const rangeEnd = 22 * 60
  const ticks = ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM']

  return (
    <section className="shift-board" aria-labelledby="shift-board-title">
      <div className="shift-board-heading">
        <div><span className="module-section-kicker">DAILY COVERAGE</span><h2 id="shift-board-title">Shift schedule</h2><p>See how your scheduled hours overlap throughout the day.</p></div>
        <div className="shift-board-total"><strong>{rows.filter((row) => row.status === 'Active').length}</strong><span>active schedules</span></div>
      </div>
      <div className="shift-timeline-axis" aria-hidden="true"><span>SHIFT</span><div>{ticks.map((tick) => <span key={tick}>{tick}</span>)}</div></div>
      <div className="shift-timeline-rows">
        {rows.map((row) => {
          const scheduleLabel = typeof row.department === 'string' && row.department.trim() ? row.department.trim() : 'Schedule details needed'
          const { start, end } = shiftHours(row.department)
          const left = start === null ? 0 : Math.max(0, Math.min(100, (start - rangeStart) / (rangeEnd - rangeStart) * 100))
          const right = end === null ? 0 : Math.max(0, Math.min(100, (end - rangeStart) / (rangeEnd - rangeStart) * 100))
          const width = start === null || end === null ? 0 : Math.max(3, right - left)
          const rules = shiftRules[row.id] ?? { breakDuration: 'Break not set', grace: 'No grace period', days: 'Working days not set', overtime: 'Overtime rule not set' }
          return (
            <article className="shift-timeline-row" key={row.id}>
              <div className="shift-timeline-meta"><span className="shift-timeline-icon"><Clock3 size={17} /></span><span><strong>{row.name}</strong><small>{rules.breakDuration} · {rules.grace} · {rules.days}</small><small>{rules.overtime}</small></span></div>
              <div className="shift-timeline-track" aria-label={`${row.name}: ${scheduleLabel}`}>
                <span className="shift-timeline-fill" style={{ left: `${left}%`, width: `${width}%` }} />
                {start !== null && end !== null ? <span className="shift-timeline-time" style={{ left: `${left}%`, width: `${width}%` }}>{scheduleLabel}</span> : <span className="shift-timeline-unset">{scheduleLabel}</span>}
              </div>
            </article>
          )
        })}
        {!rows.length && <div className="shift-board-empty">No shifts yet. Add a shift to start planning coverage.</div>}
      </div>
      <div className="shift-board-legend"><span><i /> Scheduled hours</span></div>
    </section>
  )
}
