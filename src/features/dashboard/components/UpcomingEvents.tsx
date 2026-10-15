import { CalendarClock, ClipboardCheck, Users, UserPlus, Cake, CalendarDays, Wallet, Sun } from 'lucide-react'
import { useState } from 'react'
import type { UpcomingEvent } from '../data/dashboardData'
import { useHRContent } from '@/features/hr-content/hooks/useHRContent'
import { navigateTo } from '@/app/router/navigation'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { leaveService } from '@/features/leave/services/leave.service'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

const eventIcons = {
  Meeting: Users,
  People: UserPlus,
  Performance: ClipboardCheck,
  Birthday: Cake,
  Leave: CalendarDays,
  Holiday: Sun,
  Payroll: Wallet,
}

function eventDay(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).getDate()
}

function eventMonth(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleString('en-US', { month: 'short' })
}

export default function UpcomingEvents() {
  useHRMDataChange()
  const [filter, setFilter] = useState('All')
  const { holidays } = useHRContent()
  const employees = useEmployees()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const birthdayEvents: UpcomingEvent[] = employees.flatMap((employee) => {
    if (!employee.dateOfBirth) return []
    const [, month, day] = employee.dateOfBirth.split('-').map(Number)
    const nextBirthday = new Date(now.getFullYear(), month - 1, day)
    if (`${nextBirthday.getFullYear()}-${String(nextBirthday.getMonth() + 1).padStart(2, '0')}-${String(nextBirthday.getDate()).padStart(2, '0')}` < today) nextBirthday.setFullYear(now.getFullYear() + 1)
    const date = `${nextBirthday.getFullYear()}-${String(nextBirthday.getMonth() + 1).padStart(2, '0')}-${String(nextBirthday.getDate()).padStart(2, '0')}`
    return nextBirthday.getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000 ? [{ date, type: `${employee.firstName} ${employee.lastName}’s birthday`, person: employee.dept, category: 'Birthday' as const }] : []
  })
  const leaveEvents: UpcomingEvent[] = leaveService.list().filter((leave) => leave.status === 'Approved' && leave.endDate >= today).map((leave) => ({ date: leave.startDate < today ? today : leave.startDate, type: `${leave.employeeName} · ${leave.leaveType}`, person: `${leave.numberOfDays} day${leave.numberOfDays === 1 ? '' : 's'} · approved leave`, category: 'Leave' }))
  const calendar: UpcomingEvent[] = [
    ...birthdayEvents,
    ...leaveEvents,
    ...holidays.filter((holiday) => holiday.date >= today).map((holiday) => ({ date: holiday.date, dateLabel: undefined, time: 'All day', type: holiday.name, person: `${holiday.type} · ${holiday.description}`, category: 'Holiday' as const })),
  ].sort((first, second) => first.date.localeCompare(second.date))
  const events = calendar.filter((event) => filter === 'All' || event.category === filter)
  return (
    <section className="card dashboard-events-card" aria-labelledby="upcoming-events-title">
      <div className="dashboard-section-heading">
        <div>
          <div className="badge badge--info">Events</div>
          <h3 className="section-title" id="upcoming-events-title">Upcoming Events</h3>
        </div>
        <div className="dashboard-event-tools"><select aria-label="Filter HR calendar events" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option>{['Birthday', 'People', 'Leave', 'Holiday', 'Payroll', 'Performance', 'Meeting'].map((category) => <option key={category}>{category}</option>)}</select><CalendarClock className="dashboard-section-icon" size={17} aria-hidden="true" /></div>
      </div>

      <div className="upcoming-event-list">
        {events.map((event) => {
          const Icon = eventIcons[event.category]
          return (
            <button className="upcoming-event upcoming-event--clickable" key={`${event.date}-${event.type}`} onClick={() => navigateTo(event.category === 'Holiday' ? '/app/holidays' : event.category === 'Leave' ? '/app/leave' : event.category === 'Payroll' ? '/app/payroll' : '/app/employees')}>
              <div className="upcoming-event-date" aria-label={event.dateLabel ?? event.date}>
                <span>{event.dateLabel ?? eventMonth(event.date)}</span>
                <strong>{event.dateLabel ? eventDay(event.date) : event.date.split('-')[2]}</strong>
              </div>
              <div className={`upcoming-event-icon upcoming-event-icon--${event.category.toLowerCase()}`} aria-hidden="true">
                <Icon size={15} />
              </div>
              <div className="upcoming-event-content">
                <div className="upcoming-event-title-row">
                  <h4>{event.type}</h4>
                  <span className={`upcoming-event-category upcoming-event-category--${event.category.toLowerCase()}`}>{event.category}</span>
                </div>
                <p>{event.person}</p>
                <span className="upcoming-event-time">{event.time ?? 'Time not scheduled'}</span>
              </div>
            </button>
          )
        })}
        {!events.length && <p className="payroll-empty">No upcoming events in this category.</p>}
      </div>
    </section>
  )
}
