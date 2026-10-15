import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BriefcaseBusiness, Building2, CalendarDays, Mail, MapPin, Pencil, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { sanitizeText } from '@/utils/sanitize-text'
import { useEmployeeRecord } from '@/employee/hooks/useEmployeeRecord'
import { useAuth } from '@/app/providers/use-auth'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

type ProfileForm = { firstName: string; lastName: string; phone: string; title: string; dept: string; address: string; emergencyContactName: string; emergencyContactPhone: string }
const textValue = (value?: string) => value?.trim() || 'Not provided'

export default function ProfilePage() {
  const { employee: employeeById } = useEmployeeRecord()
  const { user, updateUser } = useAuth()
  const employees = useEmployees()
  const employee = employeeById ?? findCurrentEmployee(employees, user)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProfileForm>(() => ({ firstName: employee?.firstName ?? user?.name?.split(' ')[0] ?? '', lastName: employee?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? '', phone: employee?.phone ?? user?.phone ?? '', title: employee?.title ?? user?.jobTitle ?? '', dept: employee?.dept ?? user?.department ?? '', address: employee?.address ?? user?.address ?? '', emergencyContactName: employee?.emergencyContactName ?? user?.emergencyContactName ?? '', emergencyContactPhone: employee?.emergencyContactPhone ?? user?.emergencyContactPhone ?? '' }))
  const [photo, setPhoto] = useState(() => user?.profilePhoto ?? (employee ? localStorage.getItem(`hrm-employee-profile-photo:${employee.id}`) : '') ?? '')
  const [photoDraft, setPhotoDraft] = useState(() => user?.profilePhoto ?? (employee ? localStorage.getItem(`hrm-employee-profile-photo:${employee.id}`) : '') ?? '')
  useEffect(() => {
    const savedPhoto = user?.profilePhoto ?? (employee ? localStorage.getItem(`hrm-employee-profile-photo:${employee.id}`) : '') ?? ''
    setPhoto(savedPhoto)
    setPhotoDraft(savedPhoto)
  }, [employee?.id, user?.profilePhoto])
  const name = employee ? `${employee.firstName} ${employee.lastName}` : user?.name || 'Your profile'
  const title = employee?.title ?? user?.jobTitle ?? 'Not provided'
  const dept = employee?.dept ?? user?.department ?? 'Not provided'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()
  const updateForm = (key: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const openEdit = () => { setForm({ firstName: employee?.firstName ?? user?.name?.split(' ')[0] ?? '', lastName: employee?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? '', phone: employee?.phone ?? user?.phone ?? '', title: employee?.title ?? user?.jobTitle ?? '', dept: employee?.dept ?? user?.department ?? '', address: employee?.address ?? user?.address ?? '', emergencyContactName: employee?.emergencyContactName ?? user?.emergencyContactName ?? '', emergencyContactPhone: employee?.emergencyContactPhone ?? user?.emergencyContactPhone ?? '' }); setEditing(true) }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.phone.trim()) { toast.error('Enter a contact phone number.'); return }
    const firstName = sanitizeText(form.firstName)
    const lastName = sanitizeText(form.lastName)
    const profile = { name: `${firstName} ${lastName}`.trim(), phone: sanitizeText(form.phone), jobTitle: sanitizeText(form.title), department: sanitizeText(form.dept), address: sanitizeText(form.address), emergencyContactName: sanitizeText(form.emergencyContactName), emergencyContactPhone: sanitizeText(form.emergencyContactPhone), profilePhoto: photoDraft }
    if (employee) {
      const updated = { ...employee, firstName, lastName, phone: profile.phone, title: profile.jobTitle, dept: profile.department, address: profile.address, emergencyContactName: profile.emergencyContactName, emergencyContactPhone: profile.emergencyContactPhone }
      employeeStore.save(employeeStore.getSnapshot().map((item) => item.id === employee.id ? updated : item))
      if (photoDraft) localStorage.setItem(`hrm-employee-profile-photo:${employee.id}`, photoDraft)
      else localStorage.removeItem(`hrm-employee-profile-photo:${employee.id}`)
    }
    updateUser(profile)
    setPhoto(photoDraft)
    window.dispatchEvent(new Event('hrm:data-change'))
    setEditing(false)
    toast.success('Personal details saved to your profile.')
  }
  const readPhoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Choose an image file for your profile photo.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Profile photos must be 2 MB or smaller.'); return }
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' && setPhotoDraft(reader.result)
    reader.onerror = () => toast.error('Could not read this image. Try another file.')
    reader.readAsDataURL(file)
  }

  const role = user?.organizationRole || user?.globalRole || user?.role || 'Employee'
  const permissions = user?.permissions ?? []
  return <PageContainer>
    <div className="profile-page">
      <PageHeader title="My profile" subtitle="Your personal and employment information." actions={<button className="profile-action-button" type="button" onClick={openEdit}><Pencil size={15} /> Edit personal details</button>} />
      <section className="profile-hero-card">
        <div className="profile-hero-identity">
          <div className="profile-photo-frame" aria-label={`${name} profile photo`}>{photo ? <img src={photo} alt={`${name} profile`} /> : initials}</div>
          <div className="profile-hero-copy">
            <h2>{name}</h2>
            <p>{role} · {title} · {dept}</p>
            <div className="profile-hero-pills">
              <span>{employee?.status ?? 'Active'}</span><span>{dept}</span><span>{employee?.id ?? user?.email ?? 'Profile'}</span>
            </div>
          </div>
        </div>
        <div className="profile-hero-side"><span><small>Work location</small><strong>{employee?.location ?? textValue(user?.address)}</strong></span><span><small>Employment type</small><strong>{employee?.employmentType ?? 'Employee'}</strong></span></div>
      </section>
      <div className="profile-details-grid">
        <section className="profile-detail-card">
          <header className="profile-card-heading"><span className="profile-card-icon"><UserRound size={18} /></span><h2>Personal details &amp; emergency contact</h2></header>
          <div className="profile-fields-grid">
            <ProfileField icon={<UserRound size={15} />} label="Full name" value={name} /><ProfileField icon={<Mail size={15} />} label="Work email" value={employee?.email ?? user?.email} /><ProfileField icon={<Phone size={15} />} label="Phone" value={employee?.phone ?? user?.phone} /><ProfileField icon={<MapPin size={15} />} label="Address" value={employee?.address ?? user?.address} /><ProfileField icon={<UserRound size={15} />} label="Emergency contact" value={employee?.emergencyContactName ?? user?.emergencyContactName} /><ProfileField icon={<Phone size={15} />} label="Emergency phone" value={employee?.emergencyContactPhone ?? user?.emergencyContactPhone} />
          </div>
        </section>
        <section className="profile-detail-card">
          <header className="profile-card-heading"><span className="profile-card-icon"><BriefcaseBusiness size={18} /></span><h2>Employment, location &amp; access</h2></header>
          <div className="profile-fields-grid">
            <ProfileField icon={<Building2 size={15} />} label="Department" value={dept} /><ProfileField icon={<BriefcaseBusiness size={15} />} label="Job title" value={title} /><ProfileField icon={<UserRound size={15} />} label="Manager" value={employee?.manager} /><ProfileField icon={<MapPin size={15} />} label="Work location" value={employee?.location ?? user?.address} /><ProfileField icon={<CalendarDays size={15} />} label="Joining date" value={employee?.joinDate} /><ProfileField icon={<ShieldCheck size={15} />} label="Role" value={role} />
          </div>
          <div className="profile-permissions"><span className="profile-field-label">Role permissions</span><div>{permissions.length ? permissions.map((permission) => <span key={permission}>{permission}</span>) : <span>Standard employee access</span>}</div></div>
        </section>
      </div>
      {editing && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditing(false)}><form className="form-modal employee-profile-edit-form" onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title"><button type="button" className="modal-close" aria-label="Close" onClick={() => setEditing(false)}>×</button><p className="eyebrow">PERSONAL INFORMATION</p><h2 id="edit-profile-title">Edit personal details</h2><label>Profile photo<input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0])} /></label>{photoDraft && <div className="employee-profile-photo-preview"><img src={photoDraft} alt="Profile photo preview" /><button type="button" className="button" onClick={() => setPhotoDraft('')}>Remove photo</button></div>}<label>First name<input required value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} /></label><label>Last name<input required value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} /></label><label>Phone<input required value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label><label>Job title<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} /></label><label>Department<input value={form.dept} onChange={(event) => updateForm('dept', event.target.value)} /></label><label>Address<textarea maxLength={240} value={form.address} onChange={(event) => updateForm('address', event.target.value)} /></label><label>Emergency contact name<input value={form.emergencyContactName} onChange={(event) => updateForm('emergencyContactName', event.target.value)} /></label><label>Emergency contact phone<input value={form.emergencyContactPhone} onChange={(event) => updateForm('emergencyContactPhone', event.target.value)} /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="profile-action-button">Save changes</button></div></form></div>}
    </div>
  </PageContainer>
}

function ProfileField({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  return <div className="profile-detail-field"><span className="profile-field-label">{icon}{label}</span><strong>{textValue(value)}</strong></div>
}
