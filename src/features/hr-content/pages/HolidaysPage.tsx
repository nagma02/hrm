import { useMemo, useState, type FormEvent } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import { sanitizeText } from '@/utils/sanitize-text'
import { hrContentStore, type HRHoliday } from '../data/hrContentStore'
import { useHRContent } from '../hooks/useHRContent'
import { notificationService } from '@/features/notifications/services/notification.service'

const blank: HRHoliday = { id: '', name: '', date: '', endDate: '', duration: 'full_day', type: 'Company holiday', description: '' }
function validDate(value: string) { const parsed = parseISO(value); return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value }
function showDate(value: string) { return validDate(value) ? format(parseISO(value), 'dd MMMM yyyy') : '—' }
function typeLabel(value: string) { return value === 'Company holiday' ? 'Holiday By Company' : value === 'Regional holiday' ? 'Public Holiday' : value }
function exportCsv(rows: HRHoliday[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const lines = [['Title', 'Start Date', 'End Date', 'Duration', 'Type', 'Details'], ...rows.map((row) => [row.name, row.date, row.endDate || row.date, row.duration || 'full_day', typeLabel(row.type), row.description])]
  const url = URL.createObjectURL(new Blob([lines.map((line) => line.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = 'holidays.csv'; link.click(); URL.revokeObjectURL(url)
}

export default function HolidaysPage() {
  const { holidays } = useHRContent()
  const [editing, setEditing] = useState<HRHoliday | null>(null)
  const [details, setDetails] = useState<HRHoliday | null>(null)
  const [form, setForm] = useState<HRHoliday>(blank)
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const openForm = (holiday?: HRHoliday) => { setEditing(holiday ?? null); setForm(holiday ? { ...blank, ...holiday } : { ...blank }) }
  const filtered = useMemo(() => holidays.filter((item) => `${item.name} ${item.description} ${item.type} ${item.date}`.toLowerCase().includes(query.trim().toLowerCase())), [holidays, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = sanitizeText(form.name)
    const description = sanitizeText(form.description)
    if (!name) { toast.error('Enter a holiday name.'); return }
    if (!validDate(form.date) || (form.endDate && !validDate(form.endDate))) { toast.error('Choose valid holiday dates.'); return }
    if (form.endDate && form.endDate < form.date) { toast.error('End date must be on or after the start date.'); return }
    const duplicate = holidays.some((item) => item.id !== editing?.id && item.date === form.date && item.name.trim().toLowerCase() === name.toLowerCase())
    if (duplicate) { toast.error('That holiday is already listed for this date.'); return }
    try {
      const holiday = { ...form, name, description, id: editing?.id ?? `HOL-${Date.now()}` }
      hrContentStore.saveHoliday(holiday)
      await notificationService.publishHoliday(holiday)
      setEditing(null); setForm({ ...blank })
      toast.success(editing ? 'Holiday updated and shared with employees.' : 'Holiday added and shared with employees.')
    } catch (error) { toast.error(error instanceof Error ? `Could not save this holiday: ${error.message}` : 'Could not save this holiday.') }
  }
  const remove = (holiday: HRHoliday) => {
    if (!window.confirm(`Delete ${holiday.name}?`)) return
    try { hrContentStore.deleteHoliday(holiday.id); toast.success('Holiday deleted.') }
    catch { toast.error('Could not delete this holiday. Try again.') }
  }

  return <PageContainer>
    <div className="holiday-breadcrumb"><span>⌂</span><span>Home</span><b>›</b><span>Holidays</span><b>›</b><strong>All Holidays</strong></div>
    <section className="panel holiday-admin-panel">
      <header className="holiday-admin-heading"><h1>All Holidays</h1><div><button className="button primary" onClick={() => openForm()}><Plus size={15} /> Add Holiday</button><button className="button holiday-more-button" aria-label="Holiday actions" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><MoreVertical size={17} /></button>{menuOpen && <div className="holiday-actions-menu"><button onClick={() => { exportCsv(filtered); setMenuOpen(false) }}>Export holidays</button></div>}</div></header>
      <div className="holiday-table-tools"><label>Show<select aria-label="Holidays per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select> entries per page</label><label>Search:<input aria-label="Search holidays" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Search holidays..." /></label></div>
      <div className="table-scroll holiday-admin-table-scroll"><table className="hr-table holiday-admin-table"><thead><tr><th># ↕</th><th>Title</th><th>Start Date</th><th>End Date</th><th>Duration</th><th>Type</th><th>Details</th><th>Action</th></tr></thead><tbody>{visible.map((holiday, index) => <tr key={holiday.id}><td>{(page - 1) * pageSize + index + 1}</td><td><button className="holiday-title-button" onClick={() => setDetails(holiday)}>{holiday.name}</button></td><td>{showDate(holiday.date)}</td><td>{showDate(holiday.endDate || holiday.date)}</td><td><span className="holiday-duration-pill">{holiday.duration || 'full_day'}</span></td><td><span className={`holiday-type-pill holiday-type-${holiday.type.toLowerCase().replaceAll(' ', '-')}`}>{typeLabel(holiday.type)}</span></td><td>{holiday.description || '—'}</td><td><div className="holiday-icon-actions"><button aria-label={`Edit ${holiday.name}`} onClick={() => openForm(holiday)}><Pencil size={14} /></button><button aria-label={`Delete ${holiday.name}`} onClick={() => remove(holiday)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>{!visible.length && <div className="empty-state"><b>{holidays.length ? 'No matching holidays' : 'No holidays yet'}</b><span>{holidays.length ? 'Try a different search.' : 'Add a holiday to publish it to employee calendars.'}</span></div>}</div>
      <footer className="holiday-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries</span><div><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /></button>{Array.from({ length: pageCount }, (_, index) => <button key={index} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight size={17} /></button></div></footer>
    </section>
    {editing !== null && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}><form className="form-modal" onSubmit={submit}><button type="button" className="modal-close" aria-label="Close" onClick={() => setEditing(null)}>×</button><p className="eyebrow">HOLIDAY CALENDAR</p><h2>{editing.id ? 'Edit holiday' : 'Add holiday'}</h2><label>Holiday name<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Start date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>End date<input type="date" value={form.endDate || ''} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label><label>Duration<select value={form.duration || 'full_day'} onChange={(event) => setForm({ ...form, duration: event.target.value as HRHoliday['duration'] })}><option value="full_day">Full day</option><option value="first_half">First half</option><option value="second_half">Second half</option></select></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Company holiday</option><option>Regional holiday</option><option>Optional holiday</option></select></label><label>Description<textarea maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setEditing(null)}>Cancel</button><button className="button primary" type="submit">Save holiday</button></div></form></div>}
    {details && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setDetails(null)}><section className="payslip-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close" onClick={() => setDetails(null)}>×</button><p className="eyebrow">{typeLabel(details.type)}</p><h2>{details.name}</h2><p>{showDate(details.date)}{details.endDate && details.endDate !== details.date ? ` – ${showDate(details.endDate)}` : ''} · {details.duration || 'full_day'}</p><p>{details.description}</p><button className="button" onClick={() => setDetails(null)}>Close</button></section></div>}
  </PageContainer>
}
