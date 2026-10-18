import { useEffect, useMemo, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Bell, CalendarDays, Check, ExternalLink, Megaphone, Search, ShieldCheck } from 'lucide-react'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { announcementEngagement } from '@/features/hr-content/data/announcementEngagement'
import type { HRAnnouncement } from '@/features/hr-content/data/hrContentStore'
import { useHRContent } from '@/features/hr-content/hooks/useHRContent'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { toast } from 'sonner'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'

type View = 'Current' | 'Archive'
type ReadFilter = 'All' | 'Unread'
type SortOrder = 'Newest first' | 'Oldest first'

const todayKey = () => format(new Date(), 'yyyy-MM-dd')
const dateLabel = (value: string) => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : '—'
}
const priorityClass = (priority: string) => `employee-priority--${priority.toLowerCase()}`
const audienceMatches = (audience: string, employee: { dept: string; title: string; location: string }) => {
  const value = audience.trim().toLowerCase()
  if (value === 'all employees' || value === 'all') return true
  if (value === 'managers') return /manager|lead|director|head/i.test(employee.title)
  if (value === 'hr team') return /(^hr$|human resources|people)/i.test(employee.dept) || /\bhr\b|people/i.test(employee.title)
  return [employee.dept, employee.title, employee.location].some((item) => item.trim().toLowerCase() === value)
}

export default function AnnouncementsPage() {
  const { employeeId, employee } = useEmployeeRecord()
  const { announcements } = useHRContent()
  useHRMDataChange()
  const [view, setView] = useState<View>('Current')
  const [readFilter, setReadFilter] = useState<ReadFilter>('All')
  const [category, setCategory] = useState('All categories')
  const [priority, setPriority] = useState('All priorities')
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest first')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<HRAnnouncement | null>(null)
  const [engagement, setEngagement] = useState(() => announcementEngagement.forEmployee(employeeId))
  useEffect(() => {
    const refreshEngagement = () => setEngagement(announcementEngagement.forEmployee(employeeId))
    refreshEngagement()
    window.addEventListener('hrm:data-change', refreshEngagement)
    return () => window.removeEventListener('hrm:data-change', refreshEngagement)
  }, [employeeId])
  const engagementById = new Map(engagement.map((row) => [row.announcementId, row]))
  const today = todayKey()

  const eligible = useMemo(() => announcements.filter((item) =>
    item.status === 'Published' && employee && audienceMatches(item.audience, employee)
      && Boolean(item.publishDate) && item.publishDate <= today,
  ), [announcements, employee, today])
  const current = eligible.filter((item) => !item.expiryDate || item.expiryDate >= today)
  const archived = eligible.filter((item) => Boolean(item.expiryDate) && item.expiryDate < today)
  const source = view === 'Current' ? current : archived
  const categories = [...new Set(source.map((item) => item.category).filter(Boolean))].sort()
  const unreadCount = current.filter((item) => !engagementById.get(item.id)?.readAt).length
  const visible = source.filter((item) => {
    const state = engagementById.get(item.id)
    const matchesRead = view === 'Archive' || readFilter === 'All' || !state?.readAt
    const matchesCategory = category === 'All categories' || item.category === category
    const matchesPriority = priority === 'All priorities' || item.priority === priority
    const matchesQuery = `${item.title} ${item.description} ${item.category} ${item.audience}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesRead && matchesCategory && matchesPriority && matchesQuery
  }).sort((left, right) => (sortOrder === 'Newest first' ? -1 : 1) * left.publishDate.localeCompare(right.publishDate))

  const markRead = (item: HRAnnouncement) => {
    if (!employeeId) return
    announcementEngagement.markRead(item.id, employeeId)
    setEngagement(announcementEngagement.forEmployee(employeeId))
    toast.success('Announcement marked as read.')
  }
  const acknowledge = (item: HRAnnouncement) => {
    if (!employeeId) return
    announcementEngagement.acknowledge(item.id, employeeId)
    setEngagement(announcementEngagement.forEmployee(employeeId))
    toast.success('Acknowledgement recorded.')
  }

  return (
    <PageContainer>
      <PageHeader title="Announcements" subtitle="Company updates shared with your team." />
      <div className="employee-announcement-shell">
        <section className="card employee-portal-section">
          <header className="employee-announcement-header">
            <div>
              <span className="eyebrow">EMPLOYEE COMMUNICATION</span>
              <h2>{view === 'Current' ? 'Latest updates' : 'Announcement archive'}</h2>
            </div>
            <span className="employee-unread-pill" aria-live="polite"><Bell size={14} /> {unreadCount} unread</span>
          </header>

          <div className="employee-filter-tabs" role="tablist" aria-label="Announcement period">
            {(['Current', 'Archive'] as const).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={view === item} className={view === item ? 'is-active' : ''} onClick={() => { setView(item); setCategory('All categories'); setPriority('All priorities') }}>
                {item}<span>{item === 'Current' ? current.length : archived.length}</span>
              </button>
            ))}
          </div>

          <div className="employee-announcement-toolbar">
            <div className="employee-filter-tabs" role="tablist" aria-label="Read status">
              {(['All', 'Unread'] as const).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={readFilter === item} className={readFilter === item ? 'is-active' : ''} onClick={() => setReadFilter(item)}>
                  {item}<span>{item === 'Unread' ? unreadCount : current.length}</span>
                </button>
              ))}
              <ToolbarSelect ariaLabel="Filter by category" value={category} onValueChange={setCategory} options={['All categories', ...categories].map((item) => ({ label: String(item), value: String(item) }))} />
              <ToolbarSelect ariaLabel="Filter by priority" value={priority} onValueChange={setPriority} options={['All priorities', 'High', 'Normal', 'Low'].map((item) => ({ label: String(item), value: String(item) }))} />
            </div>
            <div className="employee-announcement-tools"><label className="employee-announcement-search"><Search size={15} /><span className="sr-only">Search announcements</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search announcements…" /></label><ToolbarSelect ariaLabel="Sort announcements" value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)} options={['Newest first', 'Oldest first'].map((item) => ({ label: String(item), value: String(item) }))} /></div>
          </div>

          {visible.length ? <div className="employee-announcement-list">
            {visible.map((item) => {
              const state = engagementById.get(item.id)
              const isUnread = !state?.readAt
              return <article className={`employee-announcement-card${isUnread ? ' is-unread' : ''}`} key={item.id}>
                <div className="employee-announcement-card__header">
                  <span className="employee-announcement-card__icon"><Megaphone size={18} /></span>
                  <div className="employee-announcement-card__meta"><span className="employee-announcement-tag">{item.category || 'Announcement'}</span><time dateTime={item.publishDate}>{dateLabel(item.publishDate)}</time></div>
                  {isUnread && <span className="employee-unread-dot" aria-label="Unread" title="Unread" />}
                  <span className={`employee-priority ${priorityClass(item.priority)}`}>{item.priority}</span>
                </div>
                <div className="employee-announcement-card__body"><h3>{item.title}</h3><p>{item.description}</p></div>
                <div className="employee-announcement-card__footer">
                  <div className="employee-announcement-meta"><span>Posted by HR</span>{item.expiryDate && <span>Expires {dateLabel(item.expiryDate)}</span>}{item.requiresAcknowledgement && <span><ShieldCheck size={13} /> Acknowledgement required</span>}</div>
                  <div className="employee-announcement-view">
                    <span className={`employee-read-state${state?.readAt ? ' is-read' : ''}`}>{state?.readAt ? 'Read' : 'Unread'}</span>
                    <button type="button" className="text-action" onClick={() => setSelected(item)}>View details</button>
                  </div>
                </div>
              </article>
            })}
          </div> : <div className="employee-announcement-empty"><span className="employee-announcement-empty__icon"><Megaphone size={19} /></span><h3>{employee ? 'No matching announcements' : 'Employee profile unavailable'}</h3><p>{employee ? 'Try another filter or check back when HR publishes an update for your audience.' : 'Your signed-in account is not linked to an employee profile yet.'}</p></div>}
        </section>
      </div>

      {selected && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <section className="employee-announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-detail-title">
          <div className="employee-announcement-modal__header"><span className="employee-announcement-tag">{selected.category}</span><h2 id="announcement-detail-title">{selected.title}</h2></div>
          <div className="employee-announcement-modal__meta"><span><CalendarDays size={14} /> Published {dateLabel(selected.publishDate)}</span><span className={`employee-priority ${priorityClass(selected.priority)}`}>{selected.priority} priority</span><span>Posted by HR</span></div>
          <div className="employee-announcement-modal__body"><p>{selected.description}</p>
            <dl className="employee-announcement-modal__details"><div><dt>Audience</dt><dd>{selected.audience}</dd></div><div><dt>Expires</dt><dd>{selected.expiryDate ? dateLabel(selected.expiryDate) : 'No expiry'}</dd></div></dl>
            {selected.attachments?.length ? <div className="employee-announcement-attachments"><h3>Attachments</h3>{selected.attachments.map((attachment) => <a key={`${attachment.name}-${attachment.url}`} href={attachment.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />{attachment.name || attachment.url}</a>)}</div> : null}
          </div>
          <div className="employee-announcement-modal__footer">
            {selected.requiresAcknowledgement && !engagementById.get(selected.id)?.acknowledgedAt && <button type="button" className="button primary" onClick={() => acknowledge(selected)}><ShieldCheck size={15} /> Acknowledge</button>}
            {!engagementById.get(selected.id)?.readAt && <button type="button" className="button" onClick={() => markRead(selected)}><Check size={15} /> Mark as read</button>}
            {engagementById.get(selected.id)?.acknowledgedAt && <span className="employee-read-state is-read"><Check size={13} /> Acknowledged {format(parseISO(engagementById.get(selected.id)!.acknowledgedAt!), 'MMM d, yyyy')}</span>}
            <button type="button" className="button" onClick={() => setSelected(null)}>Close</button>
          </div>
        </section>
      </div>}
    </PageContainer>
  )
}
