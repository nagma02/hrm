import { Check, ClipboardList, Eye, X } from 'lucide-react'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import { useNavigate } from 'react-router-dom'
import { formatLeaveDate } from '../services/leave.service'
import type { LeaveApplication } from '../types/leave.types'

export default function LeaveRequestTable({ rows, onStatusChange }: { rows: LeaveApplication[]; onStatusChange: (row: LeaveApplication, status: 'Approved' | 'Rejected') => void }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="table-scroll"><table className="hr-table leave-table"><thead><tr><th>Employee</th><th>Leave type</th><th>Dates requested</th><th>Days</th><th>Status</th><th>Applied on</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td><div className="person-cell"><span className="avatar-mini">{row.employeeName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><b>{row.employeeName}</b><small>{row.id}</small></span></div></td>
          <td>{row.leaveType}</td><td>{row.legacyPeriod ?? <>{formatLeaveDate(row.startDate)}<span className="leave-date-divider"> — </span>{formatLeaveDate(row.endDate)}</>}</td><td>{row.numberOfDays}</td>
          <td><span className={`status-pill status-${row.status.toLowerCase()}`}><i />{row.status}</span></td><td>{formatLeaveDate(row.appliedDate)}</td>
          <td>
            <ActionDropdown
              label={`Actions for ${row.employeeName}`}
              actions={[
                { label: 'View leave details', icon: <Eye size={14} />, onClick: () => navigate(`/app/leave/${row.id}`) },
                ...(row.status === 'Pending'
                  ? [
                      { label: 'Approve', icon: <Check size={14} />, onClick: () => onStatusChange(row, 'Approved') },
                      { label: 'Reject', icon: <X size={14} />, onClick: () => onStatusChange(row, 'Rejected') },
                    ]
                  : []),
              ]}
            />
          </td>
        </tr>)}</tbody></table>
        {!rows.length && <div className="empty-state"><div className="empty-icon"><ClipboardList size={22} /></div><b>No leave requests found</b><span>Try a different search or status filter, or apply for leave.</span></div>}
      </div>
      <div className="leave-table-footer"><span>Showing <strong>{rows.length}</strong> leave {rows.length === 1 ? 'request' : 'requests'}</span><span>All request actions are saved automatically</span></div>
    </>
  )
}
