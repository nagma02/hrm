import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import StatusBadge from '@/features/shared/StatusBadge'
import { useLocation } from '@/hooks/use-location'
import { employeeStore } from '../data/employeeStore'
import { navigateTo } from '@/app/router/navigation'
import { payrollService } from '@/features/payroll/services/payroll.service'
import { deductionTotal, earningTotal, netSalary } from '@/features/payroll/data/payrollData'
import { leaveService } from '@/features/leave/services/leave.service'
import { getEmployeeLeaveBalances } from '@/features/leave/data/employeeLeaveBalances'
import { useEmployees } from '../hooks/useEmployees'
import { listAttendanceRows } from '@/features/attendance/services/attendance.service'

export default function EmployeeDetailsPage() {
  const path = useLocation()
  const id = path.split('/')[3]
  const employees = useEmployees()
  const employee = employees.find((item) => item.id === id)
  const [documentPreview, setDocumentPreview] = useState<string | null>(null)
  if (!employee) return <PageContainer><PageHeader title="Employee not found" subtitle="This employee may have been removed." actions={<button className="button" onClick={() => navigateTo('/app/employees')}>Back to employees</button>} /></PageContainer>

  const name = `${employee.firstName} ${employee.lastName}`
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const attendance = listAttendanceRows().find((record) => record.employeeId === employee.id && record.dateKey === todayKey)
  const leaves = leaveService.list().filter((record) => record.employeeId === employee.id || record.employeeEmail.toLowerCase() === employee.email.toLowerCase())
  const balances = getEmployeeLeaveBalances(employee.id, leaves, employee.email, employee.phone)
  const payroll = payrollService.list().filter((record) => record.employeeId === employee.id).sort((a,b)=>b.period.localeCompare(a.period))[0]
  const documents = ['Offer Letter', 'Joining Letter', 'ID Proof', 'Address Proof', 'Experience Letter', 'Salary Slip', 'Other HR Document']
  const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
  const downloadDocument = (label: string) => {
    const content = `${label}\nEmployee: ${name}\nEmployee ID: ${employee.id}\n\nDemo document. No file storage is connected.`
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${employee.id}-${label.toLowerCase().replaceAll(' ', '-')}.txt`; anchor.click(); URL.revokeObjectURL(url)
  }
  return <PageContainer>
    <PageHeader title="Employee Details" subtitle={`${name} — ${employee.title}`} actions={<div className="employee-page-actions"><button className="button" onClick={() => navigateTo('/app/employees')}>Back to employees</button><button className="button" onClick={() => navigateTo(`/app/employees/${employee.id}/edit`)}>Edit</button><button className="button" onClick={() => { const status = employee.status.toLowerCase() === 'inactive' ? 'Active' : 'Inactive'; if (window.confirm(`${status === 'Inactive' ? 'Deactivate' : 'Reactivate'} ${name}? HR history will be retained.`)) { employeeStore.save(employees.map((item) => item.id === employee.id ? { ...item, status } : item)); toast.success(`Employee ${status.toLowerCase()}.`) } }}>{employee.status.toLowerCase() === 'inactive' ? 'Reactivate' : 'Deactivate'}</button></div>} />
    <div className="employee-details-grid"><div className="employee-content-stack">
      <section className="card"><div className="employee-detail-identity">{employee.photoUrl ? <img src={employee.photoUrl} alt={name} className="employee-detail-avatar" /> : <span className="employee-detail-avatar">{employee.firstName[0]}{employee.lastName[0]}</span>}<div><h2>{name}</h2><p>{employee.title} · {employee.dept}</p><StatusBadge status={employee.status}/></div></div></section>
      <section className="card"><h3 className="section-title">Personal & Contact Information</h3><div className="employee-detail-list">{[['Employee ID',employee.id],['Email',employee.email],['Phone',employee.phone],['Date of birth',employee.dateOfBirth ?? 'Not provided'],['Gender',employee.gender ?? 'Not provided'],['Address',employee.address ?? employee.location]].map(([label,value])=><div className="employee-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
      <section className="card"><h3 className="section-title">Employment Information</h3><div className="employee-detail-list">{[['Department',employee.dept],['Designation',employee.title],['Manager',employee.manager ?? 'Not assigned'],['Joining date',employee.joinDate],['Employment type',employee.employmentType ?? 'Not configured'],['Location',employee.location],['Shift',employee.shift ?? 'Not assigned'],['Status',employee.status]].map(([label,value])=><div className="employee-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
      <section className="card"><h3 className="section-title">Attendance Summary</h3><div className="employee-detail-list">{[['Today status',attendance?.status ?? 'No record'],['Check in',attendance?.detail.split('—')[0]?.trim() ?? '—'],['Check out',attendance?.detail.split('—')[1]?.trim() ?? '—']].map(([label,value])=><div className="employee-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{attendance&&<button className="button" onClick={()=>navigateTo(`/app/attendance/${attendance.id}`)}>View attendance details</button>}</section>
      <section className="card"><h3 className="section-title">Leave Summary</h3><div className="table-scroll"><table className="hr-table"><thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Details</th></tr></thead><tbody>{leaves.map((row)=><tr key={row.id}><td>{row.leaveType}</td><td>{row.startDate} – {row.endDate}</td><td>{row.numberOfDays}</td><td>{row.status}</td><td><button className="text-action" onClick={()=>navigateTo(`/app/leave/${row.id}`)}>View details</button></td></tr>)}</tbody></table>{!leaves.length&&<p className="empty-state">No leave requests recorded.</p>}</div><p>Remaining paid balance: {balances.reduce((sum,row)=>sum+Math.max(0,row.annualQuota+row.carryForward-row.used),0)} days</p></section>
      <section className="card"><h3 className="section-title">Payroll Summary</h3>{payroll ? <><div className="employee-detail-list">{[['Period',payroll.period],['Basic salary',money(payroll.basic)],['Gross salary',money(earningTotal(payroll))],['Deductions',money(deductionTotal(payroll))],['Net salary',money(netSalary(payroll))],['Payment status',payroll.status]].map(([label,value])=><div className="employee-detail-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><button className="button" onClick={()=>navigateTo(`/app/payroll/${payroll.id}`)}>View payroll details</button></> : <p>No payroll record is configured.</p>}</section>
      <section className="card"><h3 className="section-title">Documents</h3><div className="table-scroll"><table className="hr-table"><thead><tr><th>Document</th><th>Availability</th><th>Actions</th></tr></thead><tbody>{documents.map((item)=><tr key={item}><td>{item}</td><td>Demo metadata</td><td><button className="text-action" onClick={()=>setDocumentPreview(item)}>View</button> <button className="text-action" onClick={()=>downloadDocument(item)}><Download size={13}/> Download sample</button></td></tr>)}</tbody></table></div><p>Files are not uploaded or stored in this demo.</p></section>
      <section className="card"><h3 className="section-title">Activity</h3><div className="employee-detail-list"><div className="employee-detail-row"><span>{employee.joinDate}</span><strong>{name} joined {employee.dept}</strong></div>{leaves.slice(0,3).map((row)=><div className="employee-detail-row" key={row.id}><span>{row.appliedDate}</span><button className="text-action" onClick={()=>navigateTo(`/app/leave/${row.id}`)}>{row.leaveType} request · {row.status}</button></div>)}</div></section>
    </div></div>
    {documentPreview&&<div className="modal-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&setDocumentPreview(null)}><section className="payslip-modal" role="dialog" aria-modal="true"><button className="modal-close" aria-label="Close document" onClick={()=>setDocumentPreview(null)}>×</button><p className="eyebrow">DEMO DOCUMENT PREVIEW</p><h2>{documentPreview}</h2><p>{name} · {employee.id}</p><p>This sample document is generated locally for preview. No employee file is stored.</p><div className="modal-actions"><button className="button" onClick={()=>setDocumentPreview(null)}>Close</button><button className="button primary" onClick={()=>downloadDocument(documentPreview)}>Download sample</button></div></section></div>}
  </PageContainer>
}
