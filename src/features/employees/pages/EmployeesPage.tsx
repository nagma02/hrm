import React, { useMemo, useState } from 'react'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { useEmployees } from '../hooks/useEmployees'
import { navigateTo } from '@/app/router/navigation'
import { toast } from 'sonner'
import { ArrowUpDown, Download, Eye, ListFilter, Pencil, Plus, Power, Rows3, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TableFilterTabs } from '@/components/tables/TableFilterTabs'
import { ToolbarSelect } from '@/components/tables/ToolbarSelect'
import { ActionDropdown } from '@/components/ui/action-dropdown'
import { employeeStore } from '../data/employeeStore'
import type { Employee } from '../data/employeesData'

type TypeTab = 'All' | 'Full-Time' | 'Contract'

// Seed data and the create form use "Full time" / "Contract"; missing values default to full time.
function employmentTypeOf(employee: Employee): Exclude<TypeTab, 'All'> | 'Other' {
  const value = (employee.employmentType ?? 'Full time').toLowerCase().replace(/[^a-z]/g, '')
  if (value === 'fulltime') return 'Full-Time'
  if (value === 'contract') return 'Contract'
  return 'Other'
}

function employmentTypeLabel(employee: Employee) {
  return (employee.employmentType ?? 'Full time').replace(/\s+/g, '-').toUpperCase()
}

function setEmployeeStatus(id: string, status: string) {
  const employees = employeeStore.getSnapshot()
  const target = employees.find((employee) => employee.id === id)
  if (!target) {
    toast.error('That employee record could not be found.')
    return
  }
  employeeStore.save(employees.map((employee) => (employee.id === id ? { ...employee, status } : employee)))
  toast.success(`${target.firstName} ${target.lastName} marked ${status.toLowerCase()}`)
}

function statusTone(status: string) {
  const value = status.toLowerCase()
  if (value.includes('active') && !value.includes('inactive')) return 'approved'
  if (value.includes('approv')) return 'approved'
  if (value.includes('pend') || value.includes('probation')) return 'pending'
  return 'muted'
}

export default function EmployeesPage() {
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get('search') ?? '',
  )
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeTab, setTypeTab] = useState<TypeTab>('All')
  const [sortValue, setSortValue] = useState('newest')
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const allEmployees = useEmployees()
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return [...allEmployees]
      .filter((employee) => {
        const matchesSearch =
          !q ||
          `${employee.firstName} ${employee.lastName} ${employee.id} ${employee.email} ${employee.dept} ${employee.title} ${employee.joinDate} ${employee.status}`
            .toLowerCase()
            .includes(q)

        const matchesStatus = statusFilter === 'All' || employee.status === statusFilter
        const matchesType = typeTab === 'All' || employmentTypeOf(employee) === typeTab
        return matchesSearch && matchesStatus && matchesType
      })
      .sort((a, b) => {
        const left = Date.parse(a.createdAt ?? a.joinDate)
        const right = Date.parse(b.createdAt ?? b.joinDate)
        return sortValue === 'newest' ? right - left : left - right
      })
  }, [allEmployees, query, statusFilter, sortValue, typeTab])

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  const pageItems = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const statusTabs = [
    { key: 'All', label: 'All', count: allEmployees.length },
    { key: 'Active', label: 'Active', count: allEmployees.filter((employee) => employee.status === 'Active').length },
    { key: 'Inactive', label: 'Inactive', count: allEmployees.filter((employee) => employee.status === 'Inactive').length },
    { key: 'Probation', label: 'Probation', count: allEmployees.filter((employee) => employee.status === 'Probation').length },
  ]

  const typeTabs = [
    { id: 'All', label: 'All', count: allEmployees.length },
    { id: 'Full-Time', label: 'Full-Time', count: allEmployees.filter((employee) => employmentTypeOf(employee) === 'Full-Time').length },
    { id: 'Contract', label: 'Contract', count: allEmployees.filter((employee) => employmentTypeOf(employee) === 'Contract').length },
  ]

  return (
    <PageContainer>
      <div className="employee-application-shell">
        <PageHeader
          eyebrow="People"
          title="Employees"
          subtitle={`${allEmployees.length} people across your organization — search, filter and manage every record.`}
          actions={
            <button type="button" className="button primary" onClick={() => navigateTo('/app/employees/create')}>
              <Plus size={15} />
              Add Employee
            </button>
          }
        />

        <TableFilterTabs
          className="employee-type-tabs"
          tabs={typeTabs}
          activeTab={typeTab}
          onTabChange={(id) => {
            setTypeTab(id as TypeTab)
            setPage(1)
          }}
        />

        <div className="employee-toolbar-row employee-toolbar-row--reference">
          <label className="employee-header-search employee-header-search--reference" aria-label="Search employees">
            <Search size={18} />
            <input
              aria-label="Search employees"
              placeholder="Search employees, id, email..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </label>

          <div className="employee-toolbar-multi-controls">
            <ToolbarSelect
              ariaLabel="Sort employees"
              icon={<ArrowUpDown size={15} />}
              value={sortValue}
              onValueChange={setSortValue}
              options={[{ label: 'Newest first', value: 'newest' }, { label: 'Oldest first', value: 'oldest' }]}
            />

            <ToolbarSelect
              ariaLabel="Filter employees by status"
              icon={<ListFilter size={15} />}
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              options={statusTabs.map((tab) => ({ label: tab.label, value: tab.key }))}
            />

            <ToolbarSelect
              ariaLabel="Rows per page"
              icon={<Rows3 size={15} />}
              value={String(rowsPerPage)}
              onValueChange={(value) => {
                setRowsPerPage(Number(value))
                setPage(1)
              }}
              options={[10, 20, 30, 50].map((value) => ({ label: `${value} per page`, value: String(value) }))}
            />

            <button type="button" className="employee-toolbar-export" aria-label="Export employee list">
              <Download size={16} />
            </button>
          </div>
        </div>

        <div className="employee-grid-shell">
          <Table className="employee-grid-table">
            <TableHeader>
              <TableRow>
                <TableHead className="employee-grid-num">S.No</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="employee-grid-action">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((employee, index) => (
                <TableRow key={employee.id} className="employee-grid-row">
                  <TableCell className="employee-grid-num">{(safePage - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <div className="employee-grid-person">
                      <Avatar className="employee-grid-avatar h-9 w-9 shrink-0 rounded-full">
                        {employee.photoUrl ? (
                          <AvatarImage src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                        ) : null}
                        <AvatarFallback className="employee-grid-avatar-fallback">
                          {employee.firstName?.[0] ?? 'E'}
                          {employee.lastName?.[0] ?? 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="employee-grid-person__text">
                        <strong>{employee.firstName} {employee.lastName}</strong>
                        <small>{employee.email}</small>
                        <div className="employee-grid-tags">
                          <span className="employee-grid-tag employee-grid-tag--type">{employmentTypeLabel(employee)}</span>
                          {employee.title ? <span className="employee-grid-tag employee-grid-tag--title">{employee.title}</span> : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="employee-grid-code">
                      <strong>{employee.id}</strong>
                      <small>Joined {employee.joinDate}</small>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="employee-grid-dept">
                      <strong>{employee.dept || '—'}</strong>
                      {employee.location ? <small>{employee.location}</small> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`employee-grid-status employee-grid-status--${statusTone(employee.status)}`}>
                      <i aria-hidden="true" />
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell className="employee-grid-date">{(employee.createdAt ?? employee.joinDate).slice(0, 10)}</TableCell>
                  <TableCell className="employee-grid-action">
                    <ActionDropdown
                      label={`Actions for ${employee.firstName} ${employee.lastName}`}
                      actions={[
                        { label: 'View details', icon: <Eye size={14} />, onClick: () => navigateTo(`/app/employees/${employee.id}`) },
                        { label: 'Edit employee', icon: <Pencil size={14} />, onClick: () => navigateTo(`/app/employees/${employee.id}/edit`) },
                        employee.status === 'Inactive'
                          ? { label: 'Mark active', icon: <Power size={14} />, onClick: () => setEmployeeStatus(employee.id, 'Active') }
                          : { label: 'Mark inactive', icon: <Power size={14} />, onClick: () => setEmployeeStatus(employee.id, 'Inactive') },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="employee-grid-empty">No employees match these filters.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="employee-pagination-bar">
          <div className="employee-pagination-meta">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1} of {filtered.length} entries
          </div>

          <div className="employee-pagination-controls-wrap">
            <button
              type="button"
              className="employee-pagination-arrow"
              aria-label="Previous page"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ‹
            </button>

            <button type="button" className="employee-pagination-number employee-pagination-number--active" aria-label={`Current page ${safePage}`}>
              {safePage}
            </button>

            <button
              type="button"
              className="employee-pagination-arrow"
              aria-label="Next page"
              disabled={safePage >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
