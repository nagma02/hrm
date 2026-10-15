import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { navigateTo } from '@/app/router/navigation'

export default function DepartmentDistribution() {
  const employees = useEmployees()
  const activeEmployees = employees.filter((employee) => employee.status.toLowerCase() !== 'inactive')
  const departmentDistribution = [...new Set(activeEmployees.map((employee) => employee.dept))].map((name) => ({ name, count: activeEmployees.filter((employee) => employee.dept === name).length }))
  const departmentTotal = activeEmployees.length
  const max = Math.max(1, ...departmentDistribution.map((department) => department.count))

  return (
    <section className="card department-distribution-card">
      <div className="department-heading">
        <div><div className="badge badge--info">Departments</div><h3 className="section-title">Department Distribution</h3></div>
        <span>{departmentTotal} employees</span>
      </div>

      <div className="department-list">
        {departmentDistribution.map((department) => (
          <button className="department-row department-row--clickable" key={department.name} onClick={() => navigateTo(`/app/employees?department=${encodeURIComponent(department.name)}`)}>
            <span className="department-name">{department.name}</span>
            <div className="department-track" role="progressbar" aria-label={`${department.name} employees`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={department.count}>
              <span style={{ width: `${(department.count / max) * 100}%` }} />
            </div>
            <strong className="department-count">{department.count}</strong>
          </button>
        ))}
        {!departmentDistribution.length && <p className="empty-state">No department data is available.</p>}
      </div>
    </section>
  )
}
