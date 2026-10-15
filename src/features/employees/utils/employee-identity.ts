import { useAuth } from '@/app/providers/use-auth'
import { employeeStore } from '@/features/employees/data/employeeStore'
import type { Employee } from '@/features/employees/data/employeesData'
import type { User } from '@/types/auth'

export function findCurrentEmployee(
  employees: Employee[] = employeeStore.getSnapshot(),
  user?: User | null,
): Employee | undefined {
  if (!user) return undefined

  const linkedById = user.employeeId
    ? employees.find((employee) => employee.id === user.employeeId)
    : undefined
  if (linkedById) return linkedById

  const normalizedEmail = user.email?.trim().toLowerCase()
  const normalizedPhone = user.phone?.replace(/\D/g, '') ?? ''

  return employees.find((employee) => {
    const employeePhone = employee.phone?.replace(/\D/g, '') ?? ''
    const matchesEmail = normalizedEmail && employee.email?.trim().toLowerCase() === normalizedEmail
    const matchesPhone = normalizedPhone && employeePhone === normalizedPhone
    return matchesEmail || matchesPhone
  })
}

export function useCurrentEmployee() {
  const { user } = useAuth()
  return findCurrentEmployee(employeeStore.getSnapshot(), user)
}

export function useEmployeeDisplayName() {
  const { user } = useAuth()
  const employee = useCurrentEmployee()

  const name = employee ? `${employee.firstName} ${employee.lastName}` : user?.name?.trim() || 'Employee'

  const initials = employee
    ? `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase() || 'E'
    : user?.name
      ?.match(/\b\w/g)
      ?.slice(0, 2)
      .join('')
      .toUpperCase() || 'E'

  return {
    name,
    initials,
    email: employee?.email ?? user?.email ?? '',
    employee,
  }
}
