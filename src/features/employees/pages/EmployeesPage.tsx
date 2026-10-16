import React, { useMemo, useState } from 'react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { employeeStore } from '../data/employeeStore'
import { useEmployees } from '../hooks/useEmployees'
import StatusBadge from '@/features/shared/StatusBadge'
import { navigateTo } from '@/app/router/navigation'
import { Download, Plus, Eye, Pencil, UserX } from 'lucide-react'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import { toast } from 'sonner'
import { buildCsv } from '@/utils/csv'

export default function EmployeesPage() {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('search') ?? '',
  )
  const [page, setPage] = useState(1)
  const [departmentFilter, setDepartmentFilter] = useState('All departments')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [designationFilter, setDesignationFilter] = useState('All designations')
  const [locationFilter, setLocationFilter] = useState('All locations')
  const [employmentFilter, setEmploymentFilter] = useState('All employment types')
  const [joinFrom, setJoinFrom] = useState('')
  const [joinTo, setJoinTo] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const pageSize = 5

  const allEmployees = useEmployees()
  React.useEffect(() => {
    const department = new URLSearchParams(window.location.search).get('department')
    if (department) setDepartmentFilter(department)
  }, [])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
      return allEmployees.filter((e) => {
      const matchesSearch =
        !q ||
        `${e.firstName} ${e.lastName} ${e.id} ${e.email} ${e.status} ${e.dept} ${e.title}`.toLowerCase().includes(q)
      const matchesDepartment =
        departmentFilter === 'All departments' || e.dept === departmentFilter
      const matchesStatus = statusFilter === 'All statuses' || e.status === statusFilter
      const matchesDesignation = designationFilter === 'All designations' || e.title === designationFilter
      const matchesLocation = locationFilter === 'All locations' || e.location === locationFilter
      const matchesEmployment = employmentFilter === 'All employment types' || (e.employmentType ?? 'Full time') === employmentFilter
      const matchesJoinDate = (!joinFrom || e.joinDate >= joinFrom) && (!joinTo || e.joinDate <= joinTo)
      const recentMonth = new URLSearchParams(window.location.search).get('new') === 'month'
      const matchesRecent = !recentMonth || e.joinDate.startsWith(new Date().toISOString().slice(0, 7))
      return matchesSearch && matchesDepartment && matchesStatus && matchesDesignation && matchesLocation && matchesEmployment && matchesJoinDate && matchesRecent
    }).sort((a, b) => (Date.parse(b.createdAt ?? b.joinDate) - Date.parse(a.createdAt ?? a.joinDate)) * (sortDirection === 'desc' ? 1 : -1))
  }, [query, allEmployees, departmentFilter, statusFilter, designationFilter, locationFilter, employmentFilter, joinFrom, joinTo, sortDirection])

  const departmentDistribution = [...new Set(allEmployees.map((employee) => employee.dept))].map((name) => ({ name, count: allEmployees.filter((employee) => employee.dept === name).length }))

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's employees and workforce information."
        actions={
          <div className="employee-page-actions" style={{ display: 'flex', gap: 8 }}>
            <button
              className="button"
              onClick={() => {
                const csv = buildCsv(
                  ['ID', 'First name', 'Last name', 'Department', 'Email', 'Status'],
                  allEmployees.map((e) => [
                    e.id,
                    e.firstName,
                    e.lastName,
                    e.dept,
                    e.email,
                    e.status,
                  ]),
                )
                const link = document.createElement('a')
                link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                link.download = 'employees.csv'
                link.click()
                toast.success('Employee export downloaded')
              }}
            >
              <Download size={14} /> Export
            </button>
            <button
              className="button header__primary-button"
              onClick={() => navigateTo('/app/employees/create')}
            >
              <Plus size={14} /> Add Employee
            </button>
          </div>
        }
      />

      <div className="employee-content-stack" style={{ display: 'grid', gap: 12 }}>
        <div className="employee-toolbar">
          <input
            placeholder="Search employees, id, email..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            className="input"
          />
          <select
            className="input"
            aria-label="Filter by department"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value)
              setPage(1)
            }}
          >
            <option>All departments</option>
            {[...new Set([...departmentDistribution.map((department) => department.name), ...allEmployees.map((employee) => employee.dept)])].map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option>All statuses</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Probation</option>
          </select>
          <select className="input" aria-label="Filter by designation" value={designationFilter} onChange={(event) => { setDesignationFilter(event.target.value); setPage(1) }}><option>All designations</option>{[...new Set(allEmployees.map((employee) => employee.title))].map((item) => <option key={item}>{item}</option>)}</select>
          <select className="input" aria-label="Filter by location" value={locationFilter} onChange={(event) => { setLocationFilter(event.target.value); setPage(1) }}><option>All locations</option>{[...new Set(allEmployees.map((employee) => employee.location))].map((item) => <option key={item}>{item}</option>)}</select>
          <select className="input" aria-label="Filter by employment type" value={employmentFilter} onChange={(event) => { setEmploymentFilter(event.target.value); setPage(1) }}><option>All employment types</option>{[...new Set(allEmployees.map((employee) => employee.employmentType ?? 'Full time'))].map((item) => <option key={item}>{item}</option>)}</select>
          <label className="employee-date-filter">From<input className="input" aria-label="Joining date from" type="date" value={joinFrom} onChange={(event) => { setJoinFrom(event.target.value); setPage(1) }}/></label>
          <label className="employee-date-filter">To<input className="input" aria-label="Joining date to" type="date" value={joinTo} onChange={(event) => { setJoinTo(event.target.value); setPage(1) }}/></label>
          <button
            className="button"
            onClick={() => {
              setQuery('')
              setDepartmentFilter('All departments')
              setStatusFilter('All statuses')
              setDesignationFilter('All designations')
              setLocationFilter('All locations')
              setEmploymentFilter('All employment types')
              setJoinFrom('')
              setJoinTo('')
              setPage(1)
            }}
          >
            Reset
          </button>
        </div>

        <div className="employee-stats">
          <div className="card">
            <div style={{ color: 'var(--color-muted)' }}>Total Employees</div>
            <div style={{ fontWeight: 700, fontSize: 21 }}>{allEmployees.length}</div>
          </div>
          <div className="card">
            <div style={{ color: 'var(--color-muted)' }}>Active Employees</div>
            <div style={{ fontWeight: 700, fontSize: 21 }}>
              {allEmployees.filter((e) => e.status === 'Active').length}
            </div>
          </div>
          <div className="card">
            <div style={{ color: 'var(--color-muted)' }}>Inactive Employees</div>
            <div style={{ fontWeight: 700, fontSize: 21 }}>
              {
                allEmployees.filter((e) => e.status === 'Inactive')
                  .length
              }
            </div>
          </div>
          <div className="card">
            <div style={{ color: 'var(--color-muted)' }}>New This Month</div>
            <div style={{ fontWeight: 700, fontSize: 21 }}>
              {allEmployees.filter((employee) => employee.joinDate.startsWith(new Date().toISOString().slice(0, 7))).length}
            </div>
          </div>
        </div>

        <section className="card employee-analytics">
          <div className="employee-analytics-heading">
            <div>
              <span className="eyebrow">TEAM MIX</span>
              <h3>Employees by Department</h3>
            </div>
            <span>
              {departmentDistribution.reduce((sum, department) => sum + department.count, 0)}{' '}
              employees
            </span>
          </div>
          <div className="employee-department-bars">
            {departmentDistribution.map((department) => (
              <div className="employee-department-row" key={department.name}>
                <span>{department.name}</span>
                <div>
                  <i
                    style={{
                      width: `${(department.count / Math.max(...departmentDistribution.map((entry) => entry.count))) * 100}%`,
                    }}
                  />
                </div>
                <strong>{department.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="card">
          <div className="employee-table-scroll" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th><button className="text-action" onClick={() => setSortDirection((value) => value === 'desc' ? 'asc' : 'desc')}>Joining Date {sortDirection === 'desc' ? '↓' : '↑'}</button></th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: 'rgba(17,24,39,0.04)',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {e.firstName[0]}
                          {e.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {e.firstName} {e.lastName}
                          </div>
                          <div style={{ color: 'var(--color-muted)', fontSize: 14 }}>{e.title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.id}</td>
                    <td>{e.dept}</td>
                    <td>{e.title}</td>
                    <td>{e.email}</td>
                    <td>{e.phone}</td>
                    <td>{e.joinDate}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td>
                      <ActionDropdown
                        label={`Actions for ${e.firstName} ${e.lastName}`}
                        actions={[
                          { label: 'View details', icon: <Eye size={14} />, onClick: () => navigateTo(`/app/employees/${e.id}`) },
                          { label: 'Edit employee', icon: <Pencil size={14} />, onClick: () => navigateTo(`/app/employees/${e.id}/edit`) },
                          {
                            label: e.status.toLowerCase() === 'inactive' ? 'Activate employee' : 'Deactivate employee',
                            icon: <UserX size={14} />,
                            onClick: () => {
                              const nextStatus = e.status.toLowerCase() === 'inactive' ? 'Active' : 'Inactive'
                              if (window.confirm(`${nextStatus === 'Inactive' ? 'Deactivate' : 'Reactivate'} ${e.firstName} ${e.lastName}? Their HR history will be retained.`)) {
                                employeeStore.save(allEmployees.map((person) => person.id === e.id ? { ...person, status: nextStatus } : person))
                                toast.success(`Employee ${nextStatus.toLowerCase()}.`)
                              }
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="employee-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--color-muted)' }}>
            Showing {pageItems.length} of {filtered.length} employees
          </div>
          <div className="employee-pagination-controls" style={{ display: 'flex', gap: 8 }}>
            <button className="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <div style={{ display: 'grid', placeItems: 'center', minWidth: 36 }}>{page}</div>
            <button
              className="button"
              disabled={page * pageSize >= filtered.length}
              onClick={() => setPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
