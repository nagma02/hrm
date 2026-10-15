import PageContainer from '@/features/shared/PageContainer'
import LeaveHeader from '../components/LeaveHeader'
import LeaveStats from '../components/LeaveStats'
import { useLeaveApplications } from '../hooks/useLeaveApplications'
import { getEmployeeLeaveBalances } from '../data/employeeLeaveBalances'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { useEmployees } from '@/features/employees/hooks/useEmployees'

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

  return (
    <PageContainer>
      <main className="leave-page">
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
          <div className="table-scroll">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave type</th>
                  <th>Annual quota</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Paid / unpaid</th>
                  <th>Carry forward</th>
                  <th>Accrued</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance) => (
                  <tr key={`${balance.employeeId}-${balance.leaveType}`}>
                    <td>{balance.employee}<small>{balance.employeeId}</small></td>
                    <td>{balance.leaveType}</td>
                    <td>{balance.annualQuota} days</td>
                    <td>{balance.used} days</td>
                    <td>{Math.max(0, balance.annualQuota + balance.carryForward - balance.used)} days</td>
                    <td>{balance.paid ? 'Paid' : 'Unpaid'}</td>
                    <td>{balance.carryForward} days</td>
                    <td>{balance.accrued} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PageContainer>
  )
}
