import { useMemo, useState, type FormEvent } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { sanitizeText } from '@/utils/sanitize-text'
import { hrContentStore, type HRAnnouncement } from '../data/hrContentStore'
import { useHRContent } from '../hooks/useHRContent'
import { notificationService } from '@/features/notifications/services/notification.service'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { announcementEngagement } from '../data/announcementEngagement'

const blank: HRAnnouncement = { id: '', title: '', description: '', category: 'HR Announcement', priority: 'Normal', publishDate: format(new Date(), 'yyyy-MM-dd'), expiryDate: '', audience: 'All employees', status: 'Draft' }
const attachmentText = (item?: HRAnnouncement | null) => item?.attachments?.map((attachment) => `${attachment.name} | ${attachment.url}`).join('\n') ?? ''
function validDate(value: string) {
  const parsed = parseISO(value)
  return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
}

export default function AnnouncementsPage() {
  const { announcements } = useHRContent()
  const employees = useEmployees()
  const [editing, setEditing] = useState<HRAnnouncement | null>(null)
  const [form, setForm] = useState(blank)
  const [details, setDetails] = useState<HRAnnouncement | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'All' | HRAnnouncement['status']>('All')
  const [attachments, setAttachments] = useState('')
  const openForm = (item?: HRAnnouncement) => { setEditing(item ?? blank); setForm(item ?? { ...blank, id: '' }); setAttachments(attachmentText(item)) }
  const visible = useMemo(() => announcements.filter((item) =>
    (status === 'All' || item.status === status)
      && `${item.title} ${item.description} ${item.category} ${item.audience}`.toLowerCase().includes(query.trim().toLowerCase()),
  ).sort((left, right) => right.publishDate.localeCompare(left.publishDate)), [announcements, query, status])

  const notifyAudience = async (announcement: HRAnnouncement) => {
    try {
      const target = announcement.audience.trim().toLowerCase()
      const selectedEmployees = target === 'all employees'
        ? employees
        : target === 'managers'
          ? employees.filter((employee) => /manager|lead|director|head/i.test(employee.title))
          : target === 'hr team'
            ? employees.filter((employee) => /(^hr$|human resources|people)/i.test(employee.dept) || /\bhr\b|people/i.test(employee.title))
            : employees.filter((employee) => [employee.dept, employee.title, employee.location].some((value) => value.trim().toLowerCase() === target))
      const recipientIds = selectedEmployees.map((employee) => employee.id).filter(Boolean)
      await notificationService.publishAnnouncement({ ...announcement, recipientIds, status: 'Published' })
      toast.success('Announcement published and audience notified.')
    } catch (error) {
      toast.error(error instanceof Error ? `Announcement saved, but notifications could not be sent: ${error.message}` : 'Announcement saved, but notifications could not be sent.')
    }
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = sanitizeText(form.title)
    const description = sanitizeText(form.description)
    if (!title) { toast.error('Enter an announcement title.'); return }
    if (!description) { toast.error('Enter an announcement description.'); return }
    if (!validDate(form.publishDate)) { toast.error('Choose a valid publish date.'); return }
    if (form.expiryDate && (!validDate(form.expiryDate) || form.expiryDate < form.publishDate)) { toast.error('Expiry date must be on or after the publish date.'); return }
    const parsedAttachments = attachments.split('\n').map((line) => {
      const [name, ...urlParts] = line.split('|')
      const url = urlParts.join('|').trim()
      if (!url) return null
      try {
        const parsed = new URL(url)
        if (!['https:', 'http:'].includes(parsed.protocol)) return null
        return { name: sanitizeText(name.trim()) || parsed.hostname, url: parsed.toString() }
      } catch { return null }
    }).filter((item): item is { name: string; url: string } => Boolean(item))
    if (attachments.trim() && parsedAttachments.length !== attachments.split('\n').filter((line) => line.trim()).length) { toast.error('Attachments must be valid http or https links, one per line, in “Name | URL” format.'); return }
    try {
      const announcement = { ...form, title, description, attachments: parsedAttachments, id: editing?.id || `ANN-${Date.now()}` }
      hrContentStore.saveAnnouncement(announcement)
      setEditing(null)
      if (announcement.status === 'Published') void notifyAudience(announcement)
      else toast.success('Announcement saved as a draft.')
    } catch { toast.error('Could not save this announcement. Check browser storage and try again.') }
  }
  const togglePublish = (item: HRAnnouncement) => {
    try {
      const announcement = { ...item, status: item.status === 'Published' ? 'Draft' as const : 'Published' as const }
      hrContentStore.saveAnnouncement(announcement)
      if (announcement.status === 'Published') void notifyAudience(announcement)
      else toast.success('Announcement unpublished.')
    } catch { toast.error('Could not update this announcement. Try again.') }
  }
  const remove = (item: HRAnnouncement) => {
    if (!window.confirm(`Delete ${item.title}?`)) return
    try { hrContentStore.deleteAnnouncement(item.id); toast.success('Announcement deleted.') }
    catch { toast.error('Could not delete this announcement. Try again.') }
  }

  return <PageContainer><PageHeader title="HR Announcements" subtitle="Create and publish updates for employees." actions={<button className="button primary" onClick={()=>openForm()}><Plus size={15}/> Create Announcement</button>}/>
    <section className="panel data-panel"><div className="panel-head"><div><h2>Announcements</h2><span>{visible.length} of {announcements.length} records</span></div><div className="table-tools"><label className="table-search"><span className="sr-only">Search announcements</span><input aria-label="Search announcements" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search announcements…"/></label><label><span className="sr-only">Filter announcements by status</span><select aria-label="Filter announcements by status" value={status} onChange={(event)=>setStatus(event.target.value as typeof status)}><option>All</option><option>Draft</option><option>Published</option></select></label></div></div><div className="table-scroll"><Table className="hr-table"><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Priority</TableHead><TableHead>Audience</TableHead><TableHead>Publish date</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{visible.map((item)=> <TableRow key={item.id}><TableCell><button className="text-action cursor-pointer font-semibold text-foreground hover:underline" onClick={()=>setDetails(item)}>{item.title}</button></TableCell><TableCell>{item.category}</TableCell><TableCell>{item.priority}</TableCell><TableCell>{item.audience}</TableCell><TableCell>{item.publishDate}</TableCell><TableCell>{item.expiryDate || 'No expiry'}</TableCell><TableCell><span className={`status-pill status-${item.status.toLowerCase()}`}><i/>{item.status}</span></TableCell><TableCell><div className="row-actions flex items-center gap-2"><button aria-label={`Edit ${item.title}`} onClick={()=>openForm(item)}><Pencil size={14}/></button><button onClick={()=>togglePublish(item)}>{item.status === 'Published' ? 'Unpublish' : 'Publish'}</button><button aria-label={`Delete ${item.title}`} onClick={()=>remove(item)}><Trash2 size={14}/></button></div></TableCell></TableRow>)}</TableBody></Table>{!visible.length&&<div className="empty-state"><b>{announcements.length ? 'No matching announcements' : 'No announcements'}</b><span>{announcements.length ? 'Try a different search or status filter.' : 'Create an announcement to share an update with employees.'}</span></div>}</div></section>
    {editing && <div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setEditing(null)}><form className="form-modal" onSubmit={submit}><button type="button" className="modal-close" aria-label="Close" onClick={()=>setEditing(null)}>×</button><p className="eyebrow">EMPLOYEE COMMUNICATION</p><h2>{editing.id ? 'Edit announcement' : 'Create announcement'}</h2><label>Title<input required maxLength={120} value={form.title} onChange={(event)=>setForm({...form,title:event.target.value})}/></label><label>Description<textarea required maxLength={2000} value={form.description} onChange={(event)=>setForm({...form,description:event.target.value})}/></label><div className="employee-form-grid"><label>Category<select value={form.category} onChange={(event)=>setForm({...form,category:event.target.value})}><option>HR Announcement</option><option>Company Announcement</option><option>Policy Update</option><option>Important Notice</option></select></label><label>Priority<select value={form.priority} onChange={(event)=>setForm({...form,priority:event.target.value as HRAnnouncement['priority']})}><option>Low</option><option>Normal</option><option>High</option></select></label><label>Publish date<input type="date" required value={form.publishDate} onChange={(event)=>setForm({...form,publishDate:event.target.value})}/></label><label>Expiry date<input type="date" value={form.expiryDate} onChange={(event)=>setForm({...form,expiryDate:event.target.value})}/></label><label>Audience<select value={form.audience} onChange={(event)=>setForm({...form,audience:event.target.value})}><option>All employees</option><option>Managers</option><option>HR team</option>{employees.map((employee)=><option key={employee.id}>{employee.dept}</option>)}{employees.map((employee)=><option key={`${employee.id}-title`}>{employee.title}</option>)}{[...new Set(employees.map((employee)=>employee.location))].map((location)=><option key={location}>{location}</option>)}</select></label><label>Status<select value={form.status} onChange={(event)=>setForm({...form,status:event.target.value as HRAnnouncement['status']})}><option>Draft</option><option>Published</option></select></label></div><label className="announcement-ack-option"><input type="checkbox" checked={Boolean(form.requiresAcknowledgement)} onChange={(event)=>setForm({...form,requiresAcknowledgement:event.target.checked})}/> Require employee acknowledgement</label><label>Attachment links<textarea value={attachments} onChange={(event)=>setAttachments(event.target.value)} placeholder={'Employee handbook | https://example.com/handbook.pdf'} /><small>Use one http or https link per line: Name | URL.</small></label><div className="modal-actions"><button type="button" className="button" onClick={()=>setEditing(null)}>Cancel</button><button className="button primary" type="submit">Save announcement</button></div></form></div>}
    {details&&<div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setDetails(null)}><section className="payslip-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close" onClick={()=>setDetails(null)}>×</button><p className="eyebrow">{details.category} · {details.priority}</p><h2>{details.title}</h2><p>{details.description}</p><p>{details.publishDate} – {details.expiryDate || 'No expiry'} · {details.audience}</p><p>{details.requiresAcknowledgement ? 'Employee acknowledgement required.' : 'Acknowledgement not required.'}</p>{details.attachments?.map((attachment)=><p key={attachment.url}><a href={attachment.url} target="_blank" rel="noreferrer">{attachment.name}</a></p>)}<h3>Employee read / acknowledgement status</h3><div className="table-scroll"><Table className="hr-table"><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Read</TableHead><TableHead>Acknowledged</TableHead></TableRow></TableHeader><TableBody>{employees.map((employee)=>{const state=announcementEngagement.list().find((entry)=>entry.announcementId===details.id&&entry.employeeId===employee.id);return <TableRow key={employee.id}><TableCell>{employee.firstName} {employee.lastName}</TableCell><TableCell>{state?.readAt ? format(new Date(state.readAt),'MMM d, yyyy p') : 'Unread'}</TableCell><TableCell>{state?.acknowledgedAt ? format(new Date(state.acknowledgedAt),'MMM d, yyyy p') : '—'}</TableCell></TableRow>})}</TableBody></Table></div><button className="button" onClick={()=>setDetails(null)}>Close</button></section></div>}

  </PageContainer>
}
