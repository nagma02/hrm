import { useCurrentEmployee } from '@/features/employees/utils/employee-identity'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

export default function ShiftsPage() {
  const employee = useCurrentEmployee()
  const schedule = employee?.shift || 'Not assigned'
  const department = employee?.dept || '—'

  return (
    <PageContainer>
      <PageHeader title="My shifts" subtitle="Your assigned schedule and working pattern." />
      <section className="card" style={{ marginTop: 20 }}>
        <div className="table-scroll">
          <table className="hr-table">
            <thead><tr><th>Shift</th><th>Timing</th><th>Department</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td>{employee?.title ?? 'Employee'}</td>
                <td>{schedule === 'Not assigned' ? '—' : schedule}</td>
                <td>{department}</td>
                <td>{schedule === 'Not assigned' ? 'Unassigned' : 'Assigned'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  )
}
