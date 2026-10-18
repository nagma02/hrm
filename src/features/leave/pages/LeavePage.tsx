import { useState } from 'react'
import PageContainer from '@/features/shared/PageContainer'
import LeaveHeader from '../components/LeaveHeader'
import LeaveStats from '../components/LeaveStats'
import { useLeaveApplications } from '../hooks/useLeaveApplications'
import { getEmployeeLeaveBalances } from '../data/employeeLeaveBalances'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { AccentCell, EntityCell, StatusDotBadge, TableToolbar } from '@/components/tables'

export function LeavePage() {
  useHRMDataChange()
  const rows = useLeaveApplications()
  const employees = useEmployees()
  const balances = employees.flatMap((employee) => getEmployeeLeaveBalances(employee.id, rows, employee.email, employee.phone))
  const counts = {
    All: rows.length,
    Pending: rows.filter((row) => row.status === 'Pending').length,
    Approved: rows.filter((row) => row.status === 'Approved').length,
    Rejected: rows.filter((row) => row.status === 'Rejected').length,
    Cancelled: rows.filter((row) => row.status === 'Cancelled').length,
  }

  const [search, setSearch] = useState('')

  const filteredBalances = balances.filter((b) =>
    `${b.employee} ${b.leaveType}`.toLowerCase().includes(search.toLowerCase().trim())
  )

  return (
    <PageContainer>
      <div className="leave-page">
        <LeaveHeader pending={counts.Pending} />
        <LeaveStats total={counts.All} pending={counts.Pending} approved={counts.Approved} rejected={counts.Rejected} />
        <section className="panel leave-balance-panel">
          <div className="leave-requests-heading">
            <div>
              <span className="leave-widget-kicker">SHARED LEAVE DATA</span>
              <h2>Leave balances</h2>
              <p>Approved requests update usage for the matching employee and leave type.</p>
            </div>
          </div>
          <TableToolbar
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search employee or leave type..."
          />
          <div className="table-scroll">
            <Table className="hr-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">S.NO</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave type</TableHead>
                  <TableHead>Annual quota</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Paid / unpaid</TableHead>
                  <TableHead>Carry forward</TableHead>
                  <TableHead>Accrued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance, index) => (
                  <TableRow key={`${balance.employeeId}-${balance.leaveType}`}>
                    <TableCell className="text-xs font-semibold text-slate-500">{index + 1}</TableCell>
                    <TableCell><EntityCell title={balance.employee} subtitle={balance.employeeId} /></TableCell>
                    <TableCell><AccentCell title={balance.leaveType} subtitle={balance.paid ? 'Paid leave' : 'Unpaid leave'} /></TableCell>
                    <TableCell className="whitespace-nowrap">{balance.annualQuota} days</TableCell>
                    <TableCell className="whitespace-nowrap">{balance.used} days</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-[#1B362B]">{Math.max(0, balance.annualQuota + balance.carryForward - balance.used)} days</TableCell>
                    <TableCell><StatusDotBadge status={balance.paid ? 'Paid' : 'Unpaid'} variant={balance.paid ? 'paid' : 'default'} /></TableCell>
                    <TableCell className="whitespace-nowrap">{balance.carryForward} days</TableCell>
                    <TableCell className="whitespace-nowrap">{balance.accrued} days</TableCell>
                  </TableRow>
                ))}
                {!filteredBalances.length && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center p-6 text-muted-foreground">
                      {balances.length ? 'No matching leave balances.' : 'No leave balances found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
