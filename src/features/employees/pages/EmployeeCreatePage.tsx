import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { employeeStore } from '../data/employeeStore'
import { navigateTo } from '@/app/router/navigation'
import { useLocation } from '@/hooks/use-location'
import { employeeSchema, type EmployeeFormValues } from '@/schemas/employee.schema'
import { sanitizeText } from '@/utils/sanitize-text'
import { useAuth } from '@/app/providers/use-auth'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'

const steps: Array<{ title: string; fields: Array<keyof EmployeeFormValues> }> = [
  { title: 'Personal information', fields: ['firstName', 'lastName', 'email', 'phone', 'gender', 'dateOfBirth', 'photoUrl'] },
  { title: 'Employment information', fields: ['id', 'dept', 'title', 'joinDate', 'location', 'manager', 'employmentType', 'shift', 'address', 'emergencyContactName', 'emergencyContactPhone', 'notes'] },
]

export default function EmployeeCreatePage() {
  const { user, updateUser } = useAuth()
  const path = useLocation()
  const editId = path.split('/')[3]
  const editing = path.endsWith('/edit')
  const linkingCurrentUser = !editing && new URLSearchParams(window.location.search).get('linkCurrentUser') === 'true'
  const identityName = user?.name?.trim().split(/\s+/) ?? []
  const existing = employeeStore.getById(editId)
  const [step, setStep] = useState(0)
  const formRef = useRef<HTMLFormElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: editing && existing
      ? existing
      : linkingCurrentUser
        ? { firstName: identityName[0] ?? '', lastName: identityName.slice(1).join(' '), email: user?.email ?? '', phone: user?.phone ?? '' }
        : undefined,
    mode: 'onTouched',
  })

  const formValues = watch()
  const photoUrl = watch('photoUrl')
  const allFormFields: Array<keyof EmployeeFormValues> = steps.flatMap((stepConfig) => stepConfig.fields)
  const sectionProgress = steps.map((stepConfig) => {
    const filledFields = stepConfig.fields.filter((fieldName) => {
      const value = formValues[fieldName]
      if (typeof value === 'string') return value.trim().length > 0
      return Boolean(value)
    }).length

    return {
      ...stepConfig,
      filledFields,
      percent: Math.round((filledFields / stepConfig.fields.length) * 100),
    }
  })

  const overallFilled = allFormFields.filter((fieldName) => {
    const value = formValues[fieldName]
    if (typeof value === 'string') return value.trim().length > 0
    return Boolean(value)
  }).length
  const overallPercent = Math.round((overallFilled / allFormFields.length) * 100)

  const onSubmit = handleSubmit((values) => {
    const list = employeeStore.getSnapshot()
    if (!editing && list.some((employee) => employee.id === values.id)) {
      toast.error('That employee ID is already in use')
      return
    }
    const safeValues = Object.fromEntries(
      Object.entries(values).map(([key, value]) => {
        const normalized = value == null ? '' : String(value)
        return [
          key,
          key === 'email' ? normalized.trim().toLowerCase() : sanitizeText(normalized),
        ]
      }),
    ) as EmployeeFormValues
    const linkedCandidate = { ...safeValues, status: 'Active' }
    if (linkingCurrentUser && (!user || findCurrentEmployee([...list, linkedCandidate], user)?.id !== linkedCandidate.id)) {
      toast.error('Keep the employee email or verified mobile number matched to your signed-in account to link this profile.')
      return
    }
    if (editing) {
      employeeStore.save(list.map((employee) => (employee.id === editId ? { ...employee, ...safeValues } : employee)))
      if (existing && user?.email.toLowerCase() === existing.email.toLowerCase()) {
        updateUser({ name: `${safeValues.firstName} ${safeValues.lastName}`, email: safeValues.email })
      }
    } else {
      employeeStore.create({ ...safeValues, status: 'Active' })
    }
    toast.success(editing ? 'Employee updated successfully' : 'Employee added successfully')
    navigateTo(editing ? `/app/employees/${editId}` : linkingCurrentUser ? '/employee/dashboard' : '/app/employees')
  })

  const field = (
    name: keyof EmployeeFormValues,
    label: string,
    placeholder: string,
    type = 'text',
  ) => (
    <label className="employee-field" key={name}>
      {label}
      <input
        {...register(name)}
        placeholder={placeholder}
        type={type}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && <small role="alert">{errors[name]?.message}</small>}
    </label>
  )

  const selectField = (
    name: keyof EmployeeFormValues,
    label: string,
    options: string[],
    placeholder = 'Select an option',
  ) => (
    <label className="employee-field" key={name}>
      {label}
      <select {...register(name)} defaultValue="" aria-invalid={Boolean(errors[name])}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {errors[name] && <small role="alert">{errors[name]?.message}</small>}
    </label>
  )

  const textAreaField = (
    name: keyof EmployeeFormValues,
    label: string,
    placeholder: string,
    rows = 4,
  ) => (
    <label className="employee-field employee-field--full" key={name}>
      {label}
      <textarea
        {...register(name)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && <small role="alert">{errors[name]?.message}</small>}
    </label>
  )

  const advance = async () => {
    const valid = await trigger(steps[step].fields)
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be 2MB or less.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setValue('photoUrl', result, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const submitForm = () => {
    formRef.current?.requestSubmit()
  }

  return (
    <PageContainer>
      <div className="employee-profile-page">
        <PageHeader
          eyebrow={editing ? 'People · Employee record' : 'People · Onboarding'}
          title={editing ? 'Edit Employee' : 'Add Employee'}
          subtitle={editing ? 'Update personal and employment details for this employee' : 'Create a new employee record and complete onboarding details'}
          actions={
            <>
              <span className="page-hero__chip">Active</span>
              <button type="button" className="button primary" aria-label="Save draft" onClick={submitForm}>
                Save draft
              </button>
            </>
          }
        />

        <nav className="employee-profile-tabs" aria-label="Employee sections">
          {steps.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={step === index ? 'selected' : ''}
              aria-current={step === index ? 'step' : undefined}
              onClick={() => setStep(index)}
            >
              {item.title}
            </button>
          ))}
        </nav>

        <form ref={formRef} onSubmit={onSubmit} className="employee-form employee-form-shell" noValidate>
          <div className="employee-form-progress-panel" aria-live="polite">
            <div
              className="employee-form-progress-ring"
              style={{
                background: `conic-gradient(var(--sidebar-bg, #1B362B) ${overallPercent * 3.6}deg, #E6F4EA 0deg)`,
              }}
            >
              <div className="employee-form-progress-ring-inner">
                <div>
                  <strong>{overallPercent}%</strong>
                  <span>done</span>
                </div>
              </div>
            </div>

            <div className="employee-form-progress-content">
              <div className="employee-form-progress-header">
                <div className="employee-form-progress-label-wrap">
                  <span className="employee-form-progress-label">Employee completion: {overallPercent}%</span>
                  <span className="employee-form-progress-subtitle">Fill required personal and employment fields to complete onboarding.</span>
                </div>
              </div>
              <div className="employee-form-progress-track">
                <i style={{ width: `${overallPercent}%` }} />
              </div>
              <div className="employee-form-section-progress-list">
                <div className={`employee-form-section-progress ${step === 0 ? 'active' : ''}`}>
                  <strong>Personal information</strong>
                  <span>{sectionProgress[0].percent}%</span>
                </div>
                <div className={`employee-form-section-progress ${step === 1 ? 'active' : ''}`}>
                  <strong>Employment information</strong>
                  <span>{sectionProgress[1].percent}%</span>
                </div>
              </div>
            </div>
          </div>

          <section className="employee-profile-column employee-profile-form-card">
            <div className="employee-profile-section-title">
              <span className="employee-profile-icon" aria-hidden="true">◌</span>
              <h2>{steps[step].title}</h2>
            </div>

            {step === 0 ? (
              <>
                <div className="employee-form-photo-card profile-upload-box">
                  <div className="employee-form-photo-preview employee-profile-avatar">
                    {photoUrl ? <img src={photoUrl} alt="Employee profile preview" /> : <span>N</span>}
                  </div>
                  <div className="employee-form-photo-copy">
                    <strong>Employee photo</strong>
                    <span>Upload a clear professional photo. Recommended size: 400x400px, max 2MB.</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoUpload}
                  />
                  <button type="button" className="employee-profile-upload-button" onClick={() => fileInputRef.current?.click()}>
                    Upload Photo
                  </button>
                </div>

                <div className="employee-form-grid employee-form-grid--profile">
                  {field('firstName', 'First name', 'e.g. Alex')}
                  {field('lastName', 'Last name', 'e.g. Morgan')}
                  {field('email', 'Work email', 'alex@company.com', 'email')}
                  {field('phone', 'Phone number', '+1 555 0100', 'tel')}
                  {selectField('gender', 'Gender', ['Female', 'Male', 'Non-binary', 'Prefer not to say'])}
                  {field('dateOfBirth', 'Date of birth', '', 'date')}
                </div>
              </>
            ) : (
              <div className="employee-form-grid employee-form-grid--profile">
                {field('id', 'Employee ID', 'e.g. E-1008')}
                {field('dept', 'Department', 'e.g. Engineering')}
                {field('title', 'Designation', 'e.g. Product designer')}
                {field('joinDate', 'Joining date', '', 'date')}
                {field('location', 'Work location', 'e.g. New York')}
                {field('manager', 'Manager', 'e.g. Priya Sharma')}
                {selectField('employmentType', 'Employment type', ['Full time', 'Part time', 'Contract', 'Intern'])}
                {selectField('shift', 'Shift', ['General Office', 'Flexible', 'Morning Shift', 'Night Shift'])}
                {textAreaField('address', 'Address', 'e.g. 15 Park Avenue, New York, NY')}
                {field('emergencyContactName', 'Emergency contact name', 'e.g. Morgan Cooper')}
                {field('emergencyContactPhone', 'Emergency contact phone', '+1 555 0140', 'tel')}
                {textAreaField('notes', 'Additional notes', 'Onboarding notes, access requests, or any special requirements.')}
              </div>
            )}

            <div className="form-actions employee-profile-form-actions">
              {step < steps.length - 1 ? (
                <button type="button" className="button primary" onClick={() => void advance()}>
                  Continue
                </button>
              ) : (
                <button className="button primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Saving…' : 'Save employee'}
                </button>
              )}
            </div>
          </section>
        </form>
      </div>
    </PageContainer>
  )
}
