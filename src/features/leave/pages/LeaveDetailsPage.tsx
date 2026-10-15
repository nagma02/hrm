import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useState, type FormEvent } from 'react'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { useLeaveApplications } from '../hooks/useLeaveApplications'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { formatLeaveDate, leaveService } from '../services/leave.service'

export function LeaveDetailsPage() {
  useHRMDataChange()
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const records = useLeaveApplications()
  const record = records.find((item) => item.id === id) ?? leaveService.getById(id)
  if (!record) return <PageContainer><PageHeader title="Leave request not found" subtitle="This leave request may have been removed." actions={<button className="button" onClick={() => navigate('/app/leave')}>Back to leave</button>} /></PageContainer>

  const act = async (status: 'Approved' | 'Rejected', decisionComment?: string) => {
    if (status === 'Approved' && !window.confirm(`Approve ${record.employeeName}’s ${record.leaveType.toLowerCase()} request?`)) return
    try {
      await leaveService.updateStatus(record.id, status, decisionComment ? { decisionComment } : undefined)
      toast.success(`Leave request ${status.toLowerCase()}.`)
      navigate('/app/leave')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update the leave request.')
    }
  }
  const reject = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (rejectionReason.trim().length < 10) return; void act('Rejected', rejectionReason.trim()) }
  return <PageContainer>
    <PageHeader title="Leave request details" subtitle={`${record.employeeName} · ${record.id}`} actions={<button className="button" onClick={() => navigate('/app/leave')}>Back to leave</button>} />
    <section className="card leave-detail-card">
      <div className="leave-detail-heading"><div><p className="eyebrow">APPLICATION</p><h3>{record.leaveType}</h3></div><span className={`status-pill status-${record.status.toLowerCase()}`}><i/>{record.status}</span></div>
      <dl className="leave-detail-grid">
        <div><dt>Employee</dt><dd>{record.employeeName}</dd></div><div><dt>Email</dt><dd>{record.employeeEmail || '—'}</dd></div>
        <div><dt>Start date</dt><dd>{formatLeaveDate(record.startDate)}</dd></div><div><dt>End date</dt><dd>{formatLeaveDate(record.endDate)}</dd></div>
        <div><dt>Number of days</dt><dd>{record.numberOfDays} {record.numberOfDays === 1 ? 'day' : 'days'}</dd></div><div><dt>Applied date</dt><dd>{formatLeaveDate(record.appliedDate)}</dd></div>
        <div className="leave-detail-reason"><dt>Reason</dt><dd>{record.reason}</dd></div>
        {record.attachmentName && <div className="leave-detail-reason"><dt>Attachment</dt><dd>{record.attachmentName} · filename only in demo mode</dd></div>}
        {record.decisionBy && <div><dt>Decision by</dt><dd>{record.decisionBy}</dd></div>}
        {record.decisionAt && <div><dt>Decision date</dt><dd>{formatLeaveDate(record.decisionAt.slice(0, 10))}</dd></div>}
        {record.decisionComment && <div className="leave-detail-reason"><dt>{record.status === 'Rejected' ? 'Rejection reason' : 'Decision comment'}</dt><dd>{record.decisionComment}</dd></div>}
      </dl>
      {record.status === 'Pending' && <div className="form-actions"><button className="button leave-reject-button" onClick={() => setRejecting(true)}>Reject</button><button className="button primary" onClick={() => act('Approved')}>Approve</button></div>}
    </section>
    {rejecting && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setRejecting(false)}><form className="form-modal" onSubmit={reject}><button type="button" className="modal-close" aria-label="Close rejection form" onClick={() => setRejecting(false)}>×</button><p className="eyebrow">LEAVE DECISION</p><h2>Reject this request</h2><label>Rejection reason<textarea autoFocus required minLength={10} maxLength={500} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setRejecting(false)}>Cancel</button><button className="button primary" type="submit" disabled={rejectionReason.trim().length < 10}>Reject request</button></div></form></div>}
  </PageContainer>
}
