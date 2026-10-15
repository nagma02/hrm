import React from 'react'
import { useEmployees } from '@/features/employees/hooks/useEmployees'

export default function EmployeeOverview() {
  const employees = useEmployees()
  const departmentDistribution = [...new Set(employees.map((employee) => employee.dept))].map((name) => ({ name, count: employees.filter((employee) => employee.dept === name).length }))
  const total = departmentDistribution.reduce((s, d) => s + d.count, 0)
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="badge badge--info">Employees</div>
          <h3 className="section-title">By Department</h3>
          <div style={{ color: 'var(--color-muted)', fontSize: 14, marginTop: 6 }}>Distribution of employees</div>
        </div>
        <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>{total} employees</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {departmentDistribution.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--color-primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div style={{ color: 'var(--color-muted)' }}>{d.count}</div>
                </div>
                <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 6, marginTop: 6 }}>
                  <div style={{ width: `${(d.count / total) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
