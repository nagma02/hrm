import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Download, FileCheck2, FileText, FolderOpen, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import { moduleSeeds } from '@/features/shared/data/moduleData'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'

type Category = 'Personal Documents' | 'Employment Contracts' | 'Tax Forms' | 'Company Policies'
type DocumentRow = ModuleRow & { category?: Category; employeeId?: string; fileName?: string; fileDataUrl?: string; fileUrl?: string }
const categories: Category[] = ['Personal Documents', 'Employment Contracts', 'Tax Forms', 'Company Policies']
const key = 'hrm-documents'
const matchesCategory = (row: DocumentRow, category: Category) => {
  const value = `${row.category ?? ''} ${row.department} ${row.detail} ${row.name}`.toLowerCase()
  if (category === 'Company Policies') return !row.employeeId && (/company|policy|handbook|conduct/i.test(value))
  if (category === 'Employment Contracts') return /employment|offer|contract|experience/i.test(value)
  if (category === 'Tax Forms') return /tax|tds|form 16|payroll/i.test(value)
  return Boolean(row.employeeId) && !/employment|offer|contract|experience|tax|tds|form 16/i.test(value)
}

function readDocuments(): DocumentRow[] {
  try {
    const raw = localStorage.getItem(key)
    const value: unknown = JSON.parse(raw ?? 'null')
    if (!Array.isArray(value)) return (moduleSeeds.documents ?? []) as DocumentRow[]
    const saved = value as DocumentRow[]
    const companyDefaults = (moduleSeeds.documents ?? []).filter((row) => row.department === 'Company') as DocumentRow[]
    return [...saved, ...companyDefaults.filter((seed) => !saved.some((row) => row.id === seed.id))]
  } catch { return (moduleSeeds.documents ?? []) as DocumentRow[] }
}
function saveDocuments(rows: DocumentRow[]) { localStorage.setItem(key, JSON.stringify(rows)); window.dispatchEvent(new Event('hrm:data-change')) }

export default function DocumentsPage() {
  const { employee, employeeId } = useEmployeeRecord()
  const revision = useHRMDataChange()
  const [category, setCategory] = useState<Category>('Personal Documents')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<Category>('Personal Documents')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const rows = useMemo(() => readDocuments().filter((row) => row.employeeId === employeeId || (!row.employeeId && category === 'Company Policies' && matchesCategory(row, 'Company Policies'))), [employeeId, category, revision])
  const visible = rows.filter((row) => matchesCategory(row, category)).sort((left, right) => right.date.localeCompare(left.date))
  const selectedFile = (event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!employee || !file) { toast.error('Choose a file to upload.'); return }
    if (file.size > 4 * 1024 * 1024) { toast.error('Files must be 4 MB or smaller.'); return }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) { toast.error('Upload a PDF, JPG, PNG, or DOCX file.'); return }
    setBusy(true)
    try {
      const fileDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this file.')); reader.onerror = () => reject(new Error('Could not read this file.')); reader.readAsDataURL(file) })
      const record: DocumentRow = { id: `DOC-${employee.id}-${Date.now()}`, employeeId: employee.id, name: file.name, fileName: file.name, fileDataUrl, category: uploadCategory, department: 'Employee Records', detail: `${uploadCategory} · Pending verification`, date: format(new Date(), 'yyyy-MM-dd'), status: 'Pending' }
      saveDocuments([record, ...readDocuments()])
      setCategory(uploadCategory); setUploadOpen(false); setFile(null)
      toast.success('Document uploaded and queued for HR verification.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Document could not be uploaded.') }
    finally { setBusy(false) }
  }
  const download = (row: DocumentRow) => {
    if (row.fileUrl) { const anchor = document.createElement('a'); anchor.href = row.fileUrl; anchor.download = row.fileName || row.name; anchor.rel = 'noreferrer'; anchor.click(); return }
    const content = row.fileDataUrl ? row.fileDataUrl : new Blob([`${row.name}\n${row.detail}\nPublished in the employee document center.`], { type: 'text/plain;charset=utf-8' })
    const anchor = document.createElement('a')
    const objectUrl = content instanceof Blob ? URL.createObjectURL(content) : content
    anchor.href = objectUrl; anchor.download = row.fileName || `${row.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.txt`; anchor.click()
    if (content instanceof Blob) URL.revokeObjectURL(objectUrl)
  }

  return <PageContainer>
    <PageHeader title="My documents" subtitle="Manage your uploads and download company documents." actions={<button className="button primary" type="button" onClick={() => setUploadOpen(true)}><Upload size={15} /> Upload document</button>} />
    <section className="card employee-data-card"><header className="employee-data-toolbar"><div><span className="eyebrow">DOCUMENT CENTER</span><h2>{employee ? `${employee.firstName} ${employee.lastName} · ${employee.id}` : 'Employee files'}</h2><p>Uploads are shared with HR for verification through the employee document register.</p></div><span className="badge badge--info">{visible.length} item(s)</span></header>
      <div className="employee-document-tabs" role="tablist" aria-label="Document categories">{categories.map((item) => <button type="button" key={item} role="tab" aria-selected={category === item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}<span>{rows.filter((row) => matchesCategory(row, item)).length}</span></button>)}</div>
      <div className="table-scroll"><table className="hr-table"><thead><tr><th>Document</th><th>Category</th><th>Updated</th><th>Verification status</th><th>Action</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id}><td><span className="employee-document-name"><FileText size={16} />{row.name}</span>{row.detail && <small>{row.detail}</small>}</td><td>{row.category ?? category}</td><td>{row.date}</td><td><span className={`status-pill status-${row.status.toLowerCase().replaceAll(' ', '-')}`}><i />{row.status}</span></td><td><button className="button" type="button" onClick={() => download(row)}><Download size={14} /> Download</button></td></tr>)}{!visible.length && <tr><td colSpan={5}><div className="employee-empty-state"><FolderOpen /><h3>No documents in this category</h3><p>Upload a file for HR or check the company policy category.</p></div></td></tr>}</tbody></table></div>
    </section>
    <section className="card employee-document-note"><FileCheck2 size={18} /><div><strong>Verification status</strong><p>Pending files are visible to HR reviewers. Verified or rejected decisions and remarks will appear here when the admin record is updated.</p></div></section>
    {uploadOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setUploadOpen(false)}><form className="form-modal" onSubmit={upload} role="dialog" aria-modal="true" aria-labelledby="upload-document-title"><button type="button" className="modal-close" aria-label="Close" onClick={() => setUploadOpen(false)}>×</button><p className="eyebrow">EMPLOYEE FILES</p><h2 id="upload-document-title">Upload a document</h2><label>Category<ToolbarSelect ariaLabel="Document category" className="toolbar-select--block" value={uploadCategory} onValueChange={(value) => setUploadCategory(value as Category)} options={categories.filter((item) => item !== 'Company Policies').map((item) => ({ label: String(item), value: String(item) }))} /></label><label>Choose file<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={selectedFile} /></label><small>PDF, JPG, PNG or DOCX · maximum 4 MB</small>{file && <p className="employee-upload-selected">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}<div className="modal-actions"><button type="button" className="button" disabled={busy} onClick={() => setUploadOpen(false)}>Cancel</button><button type="submit" className="button primary" disabled={busy}><Upload size={15} />{busy ? 'Uploading…' : 'Submit for verification'}</button></div></form></div>}
  </PageContainer>
}
