import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { compOffService, type CompOffRequest, type CompOffStatus } from '../services/comp-off.service'

const tabs: Exclude<CompOffStatus, 'Pending'>[] = ['Approved', 'Rejected']

export function CompOffApprovalPage() {
  const revision = useHRMDataChange()
  const [filter, setFilter] = useState<CompOffStatus>('Pending')
  const [selected, setSelected] = useState<CompOffRequest | null>(null)
  const [busyId, setBusyId] = useState('')
  const requests = useMemo(() => compOffService.list().filter((request) => request.status === filter), [filter, revision])

  const decide = (request: CompOffRequest, status: Exclude<CompOffStatus, 'Pending'>) => {
    if (busyId) return
    setBusyId(request.id)
    try {
      compOffService.updateStatus(request.id, status)
      toast.success(`Comp off request ${status.toLowerCase()}.`)
      if (selected?.id === request.id) setSelected(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update this comp off request.')
    } finally {
      setBusyId('')
    }
  }

  return <PageContainer>
    <main className="comp-off-page">
      <h1>CompOff Approval</h1>
      <div className="comp-off-tabs" role="tablist" aria-label="Comp off request status">
        {(['Pending', ...tabs] as CompOffStatus[]).map((status) => <button key={status} role="tab" aria-selected={filter === status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status}</button>)}
      </div>
      <section className="panel comp-off-table-panel">
        <div className="table-scroll"><table className="hr-table"><thead><tr><th>Employee</th><th>Date</th><th>Type</th><th>Value</th><th>Status</th><th>View</th><th>Action</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}>
          <td><strong>{request.employeeName}</strong><small>{request.employeeId}</small></td>
          <td>{request.date}</td><td>{request.type}</td><td>{request.value}</td>
          <td><span className={`comp-off-status comp-off-status-${request.status.toLowerCase()}`}>{request.status}</span></td>
          <td><button className="comp-off-view" onClick={() => setSelected(request)}>View</button></td>
          <td>{request.status === 'Pending' ? <div className="comp-off-actions"><button disabled={Boolean(busyId)} onClick={() => decide(request, 'Approved')}>Approve</button><button disabled={Boolean(busyId)} onClick={() => decide(request, 'Rejected')}>Reject</button></div> : <span className="comp-off-decision-date">{request.decisionAt ? new Date(request.decisionAt).toLocaleDateString() : '—'}</span>}</td>
        </tr>)}</tbody></table>{!requests.length && <div className="empty-state">No {filter.toLowerCase()} comp off requests.</div>}</div>
      </section>
      {selected && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><section className="comp-off-modal" role="dialog" aria-modal="true" aria-labelledby="comp-off-modal-title"><button type="button" className="modal-close" aria-label="Close request details" onClick={() => setSelected(null)}>×</button><span className="leave-widget-kicker">COMP OFF REQUEST</span><h2 id="comp-off-modal-title">{selected.employeeName}</h2><dl><div><dt>Employee ID</dt><dd>{selected.employeeId}</dd></div><div><dt>Date worked</dt><dd>{selected.date}</dd></div><div><dt>Request type</dt><dd>{selected.type}</dd></div><div><dt>Comp off value</dt><dd>{selected.value}</dd></div><div><dt>Reason</dt><dd>{selected.reason}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl>{selected.status === 'Pending' && <div className="comp-off-actions comp-off-modal-actions"><button disabled={Boolean(busyId)} onClick={() => decide(selected, 'Approved')}>Approve</button><button disabled={Boolean(busyId)} onClick={() => decide(selected, 'Rejected')}>Reject</button></div>}</section></div>}
    </main>
  </PageContainer>
}
