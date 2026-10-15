import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/use-auth'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { employees as mockEmployees } from '@/features/employees/data/employeesData'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { leaveSchema, type LeaveFormValues } from '../schemas/leave.schema'
import { leaveService } from '../services/leave.service'
import { sanitizeText } from '@/utils/sanitize-text'
import { normalizePhoneNumber } from '@/services/auth.service'

export function LeaveApplyPage({ employeeOnly = false }: { employeeOnly?: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const employees = useEmployees()
  const [submitting, setSubmitting] = useState(false)
  const [attachmentName, setAttachmentName] = useState('')
  const employeeRecords = employees.length ? employees : mockEmployees
  const employeeOptions = employeeRecords.map((employee) => ({
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phone,
    }))
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      employeeId: user?.name ?? '',
      leaveType: undefined,
      startDate: '',
      endDate: '',
      reason: '',
    },
  })
  const [startDate, endDate] = useWatch({ control, name: ['startDate', 'endDate'] })
  const numberOfDays =
    startDate && endDate && endDate >= startDate
      ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
      : 0
  const [minimumDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  const submit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const employeeName = values.employeeId.trim()
      const matchedEmployee = employeeOptions.find(
        (option) => option.name.toLowerCase() === employeeName.toLowerCase(),
      )
      const linkedCurrentEmployee = employeeOptions.find((option) =>
        Boolean(user?.email && option.email.trim().toLowerCase() === user.email.trim().toLowerCase()),
      ) ?? employeeOptions.find((option) =>
        Boolean(user?.phone && normalizePhoneNumber(option.phone) === normalizePhoneNumber(user.phone)),
      )
      const isCurrentUser = user?.name.toLowerCase() === employeeName.toLowerCase()
      const targetEmployeeId = employeeOnly
        ? linkedCurrentEmployee?.id ?? user?.id ?? user?.email ?? employeeName
        : matchedEmployee?.id ?? (isCurrentUser ? user?.id || user.email : employeeName)
      const targetEmail = employeeOnly
        ? linkedCurrentEmployee?.email ?? user?.email ?? ''
        : matchedEmployee?.email ?? (isCurrentUser ? user?.email ?? '' : '')
      const overlapping = leaveService.list().find((request) =>
        ['Pending', 'Approved'].includes(request.status) &&
        (request.employeeId === targetEmployeeId || Boolean(targetEmail && request.employeeEmail.toLowerCase() === targetEmail.toLowerCase())) &&
        request.startDate <= values.endDate && request.endDate >= values.startDate,
      )
      if (overlapping) {
        toast.error(`These dates overlap with ${overlapping.leaveType} (${overlapping.startDate} to ${overlapping.endDate}).`)
        return
      }
      await leaveService.applyLeave({
        employeeId: targetEmployeeId,
        employeeName: matchedEmployee?.name ?? employeeName,
        employeeEmail: targetEmail,
        submittedForEmployee: !employeeOnly && !isCurrentUser,
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        numberOfDays:
          differenceInCalendarDays(parseISO(values.endDate), parseISO(values.startDate)) + 1,
        reason: sanitizeText(values.reason),
        ...(attachmentName ? { attachmentName } : {}),
      })
      toast.success('Leave application submitted successfully.')
      navigate(employeeOnly ? '/app/employee-leave' : '/app/leave')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit leave application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <PageContainer>
      <PageHeader
        title="Apply for Leave"
        subtitle="Submit a time off request for manager review."
      />
      <form className="employee-form leave-form" onSubmit={submit} noValidate>
        <section className="card">
          <h3 className="section-title">Leave request details</h3>
          <p className="form-hint">Complete the information below to submit your request.</p>
          <div className="employee-form-grid">
            <label className="employee-field">
              Employee
              <input
                className="input leave-input"
                type="text"
                placeholder="Enter employee name"
                autoComplete="name"
                readOnly={employeeOnly}
                aria-invalid={Boolean(errors.employeeId)}
                {...register('employeeId')}
              />
              {errors.employeeId && <small role="alert">{errors.employeeId.message}</small>}
            </label>
            <label className="employee-field">
              Leave type
              <select
                className="input leave-input"
                aria-invalid={Boolean(errors.leaveType)}
                {...register('leaveType')}
              >
                <option value="">Select a leave type</option>
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Sick Leave">Sick / Medical Leave (SL)</option>
                <option value="Earned Leave">Earned / Paid Leave (EL)</option>
                <option value="Unpaid Leave">Loss of Pay (LOP)</option>
                <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
              </select>
              {errors.leaveType && <small role="alert">{errors.leaveType.message}</small>}
            </label>
            <label className="employee-field">
              Start date
              <input
                className="leave-input"
                type="date"
                min={minimumDate}
                aria-invalid={Boolean(errors.startDate)}
                {...register('startDate')}
              />
              {errors.startDate && <small role="alert">{errors.startDate.message}</small>}
            </label>
            <label className="employee-field">
              End date
              <input
                className="leave-input"
                type="date"
                min={startDate || minimumDate}
                aria-invalid={Boolean(errors.endDate)}
                {...register('endDate')}
              />
              {errors.endDate && <small role="alert">{errors.endDate.message}</small>}
            </label>
            <label className="employee-field leave-days-field">
              Number of days
              <input
                className="leave-input"
                value={numberOfDays || ''}
                readOnly
                aria-readonly="true"
                placeholder="Calculated from selected dates"
              />
              <span className="leave-field-hint">
                {numberOfDays
                  ? `${numberOfDays} calendar ${numberOfDays === 1 ? 'day' : 'days'}`
                  : 'Choose a valid date range'}
              </span>
            </label>
            <label className="employee-field leave-reason-field">
              Reason for leave
              <textarea
                className="leave-input"
                rows={4}
                maxLength={500}
                placeholder="Share a brief reason for your request (10–500 characters)."
                aria-invalid={Boolean(errors.reason)}
                {...register('reason')}
              />
              {errors.reason && <small role="alert">{errors.reason.message}</small>}
            </label>
            <label className="employee-field leave-reason-field">
              Supporting attachment (optional)
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? '')} />
              <span className="leave-field-hint">Demo mode stores the file name only; no file is uploaded.</span>
            </label>
          </div>
        </section>
        <div className="form-actions">
          <button
            type="button"
            className="button"
            disabled={submitting}
            onClick={() => navigate(employeeOnly ? '/app/employee-leave' : '/app/leave')}
          >
            Cancel
          </button>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Apply Leave'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
