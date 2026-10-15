import { useMemo, useState, type FormEvent } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { sanitizeText } from '@/utils/sanitize-text'
import { hrContentStore, type HRHoliday } from '../data/hrContentStore'
import { useHRContent } from '../hooks/useHRContent'
import { notificationService } from '@/features/notifications/services/notification.service'

const blank: HRHoliday = { id: '', name: '', date: '', type: 'Company holiday', description: '' }
function validDate(value: string) {
  const parsed = parseISO(value)
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
}

export default function HolidaysPage() {
  const { holidays } = useHRContent()
  const [editing, setEditing] = useState<HRHoliday | null>(null)
  const [details, setDetails] = useState<HRHoliday | null>(null)
  const [form, setForm] = useState(blank)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const openForm = (holiday?: HRHoliday) => { setEditing(holiday ?? null); setForm(holiday ?? { ...blank }) }
  const visible = useMemo(() => holidays.filter((item) =>
    (typeFilter === 'All' || item.type === typeFilter)
      && `${item.name} ${item.description} ${item.type}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((left, right) => left.date.localeCompare(right.date)), [holidays, query, typeFilter])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = sanitizeText(form.name)
    const description = sanitizeText(form.description)
    if (!name) { toast.error('Enter a holiday name.'); return }
    if (!validDate(form.date)) { toast.error('Choose a valid holiday date.'); return }
    const duplicate = holidays.some((item) => item.id !== editing?.id && item.date === form.date && item.name.trim().toLowerCase() === name.toLowerCase())
    if (duplicate) { toast.error('That holiday is already listed for this date.'); return }
    try {
      const holiday = { ...form, name, description, id: editing?.id ?? `HOL-${Date.now()}` }
      hrContentStore.saveHoliday(holiday)
      await notificationService.publishHoliday(holiday)
      setEditing(null)
      setForm(blank)
      toast.success(editing ? 'Holiday updated and broadcast to employees.' : 'Holiday added and broadcast to employees.')
    } catch (error) {
      toast.error(error instanceof Error ? `Could not save this holiday: ${error.message}` : 'Could not save this holiday. Check browser storage and try again.')
    }
  }
  const remove = (holiday: HRHoliday) => {
    if (!window.confirm(`Delete ${holiday.name}?`)) return
    try { hrContentStore.deleteHoliday(holiday.id); toast.success('Holiday deleted.') }
    catch { toast.error('Could not delete this holiday. Try again.') }
  }

  return <PageContainer><PageHeader title="Holiday Calendar" subtitle="Manage organization holidays shown to employees." actions={<button className="button primary" onClick={() => openForm()}><Plus size={15}/> Add Holiday</button>}/>
    <section className="panel data-panel"><div className="panel-head"><div><h2>Organization holidays</h2><span>{visible.length} of {holidays.length} holidays</span></div><div className="table-tools"><label className="table-search"><span className="sr-only">Search holidays</span><input aria-label="Search holidays" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search holidays…"/></label><label><span className="sr-only">Filter holidays by type</span><select aria-label="Filter holidays by type" value={typeFilter} onChange={(event)=>setTypeFilter(event.target.value)}><option>All</option><option>Company holiday</option><option>Regional holiday</option><option>Optional holiday</option></select></label></div></div><div className="table-scroll"><table className="hr-table"><thead><tr><th>Holiday</th><th>Date</th><th>Day</th><th>Type</th><th>Description</th><th>Actions</th></tr></thead><tbody>{visible.map((holiday) => <tr key={holiday.id}><td><button className="text-action" onClick={() => setDetails(holiday)}>{holiday.name}</button></td><td>{holiday.date}</td><td>{validDate(holiday.date) ? format(parseISO(holiday.date), 'EEEE') : '—'}</td><td>{holiday.type}</td><td>{holiday.description}</td><td><div className="row-actions"><button aria-label={`Edit ${holiday.name}`} onClick={() => openForm(holiday)}><Pencil size={14}/></button><button aria-label={`Delete ${holiday.name}`} onClick={() => remove(holiday)}><Trash2 size={14}/></button></div></td></tr>)}</tbody></table>{!visible.length && <div className="empty-state"><b>{holidays.length ? 'No matching holidays' : 'No holidays yet'}</b><span>{holidays.length ? 'Try a different search or type filter.' : 'Add a holiday to publish it to employee calendars.'}</span></div>}</div></section>
    {editing !== null && <div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setEditing(null)}><form className="form-modal" onSubmit={submit}><button type="button" className="modal-close" aria-label="Close" onClick={()=>setEditing(null)}>×</button><p className="eyebrow">HOLIDAY CALENDAR</p><h2>{editing.id ? 'Edit holiday' : 'Add holiday'}</h2><label>Holiday name<input required maxLength={120} value={form.name} onChange={(event)=>setForm({...form,name:event.target.value})}/></label><label>Date<input type="date" required value={form.date} onChange={(event)=>setForm({...form,date:event.target.value})}/></label><label>Type<select value={form.type} onChange={(event)=>setForm({...form,type:event.target.value})}><option>Company holiday</option><option>Regional holiday</option><option>Optional holiday</option></select></label><label>Description<textarea maxLength={500} value={form.description} onChange={(event)=>setForm({...form,description:event.target.value})}/></label><div className="modal-actions"><button type="button" className="button" onClick={()=>setEditing(null)}>Cancel</button><button className="button primary" type="submit">Save holiday</button></div></form></div>}
    {details && <div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setDetails(null)}><section className="payslip-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close" onClick={()=>setDetails(null)}>×</button><p className="eyebrow">{details.type}</p><h2>{details.name}</h2><p>{details.date} · {validDate(details.date) ? format(parseISO(details.date), 'EEEE') : 'Date unavailable'}</p><p>{details.description}</p><button className="button" onClick={()=>setDetails(null)}>Close</button></section></div>}
  </PageContainer>
}
