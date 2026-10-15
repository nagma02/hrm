import { useMemo, useState } from 'react'
import { addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, List, MapPin } from 'lucide-react'
import { useHRContent } from '@/features/hr-content/hooks/useHRContent'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

type View = 'List' | 'Calendar'
export default function HolidaysPage() {
  const { holidays } = useHRContent()
  useHRMDataChange()
  const [view, setView] = useState<View>('List')
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('All types')
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const sorted = useMemo(() => [...holidays].sort((left, right) => left.date.localeCompare(right.date)), [holidays])
  const visible = sorted.filter((holiday) => (typeFilter === 'All types' || (typeFilter === 'Optional' ? /optional/i.test(holiday.type) : !/optional/i.test(holiday.type))))
  const upcoming = visible.filter((holiday) => holiday.date >= todayKey).slice(0, 3)
  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })
  const dateFor = (holiday: typeof sorted[number]) => { try { return parseISO(holiday.date) } catch { return new Date() } }
  const dayHolidays = (day: Date) => visible.filter((holiday) => holiday.date === format(day, 'yyyy-MM-dd'))
  const selected = selectedDate ? visible.filter((holiday) => holiday.date === selectedDate) : []

  return <PageContainer>
    <PageHeader title="Holiday calendar" subtitle="Organization holidays published by HR." actions={<div className="employee-view-toggle"><button type="button" className={view === 'List' ? 'is-active' : ''} onClick={() => setView('List')}><List size={15} /> List</button><button type="button" className={view === 'Calendar' ? 'is-active' : ''} onClick={() => setView('Calendar')}><CalendarDays size={15} /> Calendar</button></div>} />
    <section className="employee-upcoming-holidays">{upcoming.map((holiday) => { const days = differenceInCalendarDays(dateFor(holiday), new Date()); const optional = /optional/i.test(holiday.type); return <article className="card employee-upcoming-holiday" key={holiday.id}><span className="employee-holiday-date"><strong>{format(dateFor(holiday), 'dd')}</strong><small>{format(dateFor(holiday), 'MMM')}</small></span><div><span className="eyebrow">{optional ? 'OPTIONAL HOLIDAY' : 'MANDATORY HOLIDAY'}</span><h2>{holiday.name}</h2><p>{format(dateFor(holiday), 'EEEE, MMMM d, yyyy')} · {days <= 0 ? 'Today' : `in ${days} day${days === 1 ? '' : 's'}`}</p></div><span className={`status-pill ${optional ? 'status-pending' : 'status-approved'}`}><i />{optional ? 'Optional' : 'Mandatory'}</span></article> })}{!upcoming.length && <div className="employee-empty-state"><CalendarDays /><h3>No upcoming holidays</h3><p>New holidays published by HR will appear here.</p></div>}</section>
    <section className="card employee-data-card"><header className="employee-data-toolbar"><div><span className="eyebrow">HOLIDAY SCHEDULE</span><h2>{view === 'Calendar' ? format(month, 'MMMM yyyy') : 'All scheduled holidays'}</h2><p>{visible.length} holiday(s) · exact dates from the organization calendar</p></div><div className="employee-holiday-tools"><label className="sr-only" htmlFor="holiday-type-filter">Filter holiday type</label><select id="holiday-type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All types</option><option>Mandatory</option><option>Optional</option></select>{view === 'Calendar' && <div className="employee-month-controls"><button className="button" aria-label="Previous month" onClick={() => { setMonth((value) => subMonths(value, 1)); setSelectedDate('') }}><ChevronLeft size={16} /></button><strong>{format(month, 'MMM yyyy')}</strong><button className="button" aria-label="Next month" onClick={() => { setMonth((value) => addMonths(value, 1)); setSelectedDate('') }}><ChevronRight size={16} /></button></div>}</div></header>
      {view === 'List' ? <div className="employee-holiday-list">{visible.map((holiday) => { const date = dateFor(holiday); const days = differenceInCalendarDays(date, new Date()); const past = holiday.date < todayKey; const optional = /optional/i.test(holiday.type); return <article className={`employee-holiday-row${past ? ' is-past' : ''}`} key={holiday.id}><span className="employee-holiday-date"><strong>{format(date, 'dd')}</strong><small>{format(date, 'MMM')}</small></span><div className="employee-holiday-copy"><b>{holiday.name}</b><small>{format(date, 'EEEE, MMMM d, yyyy')} · {holiday.description || holiday.type}</small></div><span className={`employee-holiday-kind ${optional ? 'is-optional' : ''}`}>{optional ? 'Optional' : 'Mandatory'}</span><span className="employee-holiday-countdown">{past ? 'Past' : days === 0 ? 'Today' : `in ${days} days`}</span></article> })}{!visible.length && <div className="employee-empty-state"><CalendarDays /><h3>No holidays match this filter</h3><p>Change the holiday type or check again after HR adds dates.</p></div>}</div> : <>
        <div className="employee-calendar-grid employee-holiday-calendar"><div className="employee-calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div><div className="employee-calendar-days">{calendarDays.map((day) => { const key = format(day, 'yyyy-MM-dd'); const events = dayHolidays(day); return <button type="button" key={key} className={`employee-calendar-day${isSameMonth(day, month) ? '' : ' is-outside'}${isToday(day) ? ' is-today' : ''}${selectedDate === key ? ' is-selected' : ''}`} onClick={() => setSelectedDate(key)}><span>{format(day, 'd')}</span>{events.map((event) => <small key={event.id} title={event.name}><i />{event.name}</small>)}</button> })}</div></div>
        {selectedDate && <div className="employee-calendar-selected"><strong>{format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}</strong>{selected.length ? selected.map((holiday) => <p key={holiday.id}><MapPin size={14} />{holiday.name} · {holiday.type}</p>) : <p>No holiday scheduled for this date.</p>}</div>}
      </>}
    </section>
  </PageContainer>
}
