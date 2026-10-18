import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AccentCell, EntityCell, StatusDotBadge } from '@/components/tables'
import { readStorageValue, writeStorageValue } from '@/utils/storage'


const statusKey = 'hrm-user-session-status'
type SessionStatuses = Record<string, boolean>

function readStatuses(): SessionStatuses {
  return readStorageValue<SessionStatuses>(statusKey, {})
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
    writeStorageValue(statusKey, next)
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
    <div className="user-sessions-page">
      <PageHeader title="Users Status" subtitle="Review employee account status and active sessions." actions={<div className="user-sessions-actions"><button className="button primary" onClick={() => setShowDevices(true)}>Manage Device IDs</button><button className="button danger" onClick={logoutAll}>Logout All Users</button></div>} />
      <section className="panel user-sessions-panel">
        <div className="user-sessions-note">Session controls are shown as a frontend demo. This app does not currently have a server endpoint to revoke user sessions.</div>
        <div className="table-scroll">
          <Table className="hr-table user-sessions-table">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Session</TableHead>
                <TableHead className="!text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <EntityCell
                      avatar={<Avatar className="h-9 w-9 shrink-0 rounded-full">{row.photoUrl ? <AvatarImage src={row.photoUrl} alt={row.name} /> : null}<AvatarFallback>{row.firstName?.[0] ?? 'E'}{row.lastName?.[0] ?? ''}</AvatarFallback></Avatar>}
                      title={row.name}
                      subtitle={row.email}
                      tags={[{ label: row.role }]}
                    />
                  </TableCell>
                  <TableCell><AccentCell title={row.dept || '—'} subtitle={row.id} /></TableCell>
                  <TableCell><StatusDotBadge status={row.active ? 'Active' : 'Signed out'} variant={row.active ? 'active' : 'inactive'} /></TableCell>
                  <TableCell className="text-right">{row.active ? <button className="button danger user-session-logout" onClick={() => logout(row.id)} aria-label={`Log out ${row.name}`}>Logout</button> : <span className="muted" aria-label="No active session">—</span>}</TableCell>
                </TableRow>
              ))}
              {!rows.length && <TableRow><TableCell colSpan={4} className="user-sessions-empty text-center p-6 text-muted-foreground">No employees found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>

      </section>
      {showDevices && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowDevices(false)}><section className="comp-off-modal user-device-modal" role="dialog" aria-modal="true" aria-labelledby="user-device-title"><button className="modal-close" aria-label="Close" onClick={() => setShowDevices(false)}>×</button><span className="eyebrow">DEVICE ID</span><h2 id="user-device-title">Manage Device IDs</h2><p>This browser’s local device identifier. Other users’ devices cannot be listed without a server device registry.</p><dl><div><dt>Device ID</dt><dd className="user-device-id">{localDeviceId()}</dd></div><div><dt>Browser</dt><dd>{navigator.userAgent}</dd></div></dl><button className="button primary" onClick={async () => { try { await navigator.clipboard.writeText(localDeviceId()); toast.success('Device ID copied.') } catch { toast.error('Could not copy device ID.') } }}>Copy Device ID</button></section></div>}
    </div>
  </PageContainer>
}
