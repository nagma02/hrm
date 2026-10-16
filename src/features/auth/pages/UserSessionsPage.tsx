import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'

const statusKey = 'hrm-user-session-status'
type SessionStatuses = Record<string, boolean>

function readStatuses(): SessionStatuses {
  try { return JSON.parse(localStorage.getItem(statusKey) || '{}') as SessionStatuses }
  catch { return {} }
}

function localDeviceId() {
  const key = 'hrm-local-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `device-${Date.now().toString(36)}`
    localStorage.setItem(key, id)
  }
  return id
}

export default function UserSessionsPage() {
  useHRMDataChange()
  const employees = employeeStore.getSnapshot()
  const [statuses, setStatuses] = useState<SessionStatuses>(readStatuses)
  const [showDevices, setShowDevices] = useState(false)
  const rows = useMemo(() => employees.map((employee) => {
    const active = statuses[employee.id] ?? employee.status.toLowerCase() !== 'inactive'
    const title = employee.title.toLowerCase()
    const role = title.includes('manager') || title.includes('head') ? 'Team Head' : title.includes('lead') ? 'Team Leader' : 'Employee'
    return { ...employee, name: `${employee.firstName} ${employee.lastName}`, active, role }
  }), [employees, statuses])

  const saveStatuses = (next: SessionStatuses) => {
    setStatuses(next)
    localStorage.setItem(statusKey, JSON.stringify(next))
  }
  const logout = (id: string) => {
    saveStatuses({ ...statuses, [id]: false })
    toast.success('Local demo status updated. Server-side logout is not connected.')
  }
  const logoutAll = () => {
    saveStatuses(Object.fromEntries(rows.map((row) => [row.id, false])))
    toast.success('All local demo statuses updated. Server-side logout is not connected.')
  }

  return <PageContainer>
    <main className="user-sessions-page">
      <PageHeader title="Users Status" subtitle="Review employee account status and active sessions." actions={<div className="user-sessions-actions"><button className="button primary" onClick={() => setShowDevices(true)}>Manage Device IDs</button><button className="button danger" onClick={logoutAll}>Logout All Users</button></div>} />
      <section className="panel user-sessions-panel">
        <div className="user-sessions-note">Session controls are shown as a frontend demo. This app does not currently have a server endpoint to revoke user sessions.</div>
        <div className="table-scroll"><table className="hr-table user-sessions-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.email}</td><td><span className="user-session-role">{row.role}</span></td><td>{row.dept || '—'}</td><td><span className={`user-session-status ${row.active ? 'is-active' : 'is-inactive'}`}><i />{row.active ? 'Active' : 'Inactive'}</span></td><td>{row.active ? <button className="button danger user-session-logout" onClick={() => logout(row.id)}>Logout</button> : <span className="muted">—</span>}</td></tr>)}
          {!rows.length && <tr><td colSpan={6} className="user-sessions-empty">No employees found.</td></tr>}
        </tbody></table></div>
      </section>
      {showDevices && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowDevices(false)}><section className="comp-off-modal user-device-modal" role="dialog" aria-modal="true" aria-labelledby="user-device-title"><button className="modal-close" aria-label="Close" onClick={() => setShowDevices(false)}>×</button><span className="eyebrow">DEVICE ID</span><h2 id="user-device-title">Manage Device IDs</h2><p>This browser’s local device identifier. Other users’ devices cannot be listed without a server device registry.</p><dl><div><dt>Device ID</dt><dd className="user-device-id">{localDeviceId()}</dd></div><div><dt>Browser</dt><dd>{navigator.userAgent}</dd></div></dl><button className="button primary" onClick={async () => { try { await navigator.clipboard.writeText(localDeviceId()); toast.success('Device ID copied.') } catch { toast.error('Could not copy device ID.') } }}>Copy Device ID</button></section></div>}
    </main>
  </PageContainer>
}
