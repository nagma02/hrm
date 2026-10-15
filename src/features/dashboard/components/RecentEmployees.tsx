import { navigateTo } from '@/app/router/navigation'
import { useEmployees } from '@/features/employees/hooks/useEmployees'

export default function RecentEmployees() {
  const recent = useEmployees()
    .slice()
    .sort((first, second) => Date.parse(second.createdAt ?? second.joinDate) - Date.parse(first.createdAt ?? first.joinDate))
    .slice(0, 5)
  return <div className="card"><h3 className="section-title">Recent Employees</h3><div style={{ marginTop: 12 }}>{recent.map((employee) => <button className="recent-employee-link recent-employee-row" key={employee.id} onClick={() => navigateTo(`/app/employees/${employee.id}`)}><span><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.title}</small></span><span>{employee.id}</span></button>)}{!recent.length && <p className="empty-state">No employees have been added yet.</p>}</div></div>
}
