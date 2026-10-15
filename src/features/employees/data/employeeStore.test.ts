import { afterEach, describe, expect, it, vi } from 'vitest'
import { employeeStore } from './employeeStore'
import { employees } from './employeesData'

afterEach(() => {
  employeeStore.save(employees)
  vi.restoreAllMocks()
})

describe('employeeStore', () => {
  it('publishes newly created employees immediately and persists their creation date', () => {
    const listener = vi.fn()
    const unsubscribe = employeeStore.subscribe(listener)
    const created = employeeStore.create({
      id: 'E-NEW-01', firstName: 'Nagma', lastName: 'Siddiqui', email: 'nagma@example.com', phone: '5550109',
      dept: 'Engineering', title: 'Software Engineer', joinDate: '2026-10-08', location: 'Remote', status: 'Active',
    })

    expect(employeeStore.getSnapshot()[0]).toEqual(created)
    expect(created.createdAt).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('hrm-employees') ?? '[]')[0].id).toBe('E-NEW-01')
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('does not duplicate an employee when the same ID is saved again', () => {
    const employee = { ...employees[0], createdAt: new Date().toISOString() }
    employeeStore.create(employee)
    employeeStore.create(employee)

    expect(employeeStore.getSnapshot().filter((entry) => entry.id === employee.id)).toHaveLength(1)
  })
})
