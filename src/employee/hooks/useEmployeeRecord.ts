import { useAuth } from '@/app/providers/use-auth'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { findCurrentEmployee } from '@/features/employees/utils/employee-identity'

/** Resolve the signed-in employee by a valid linked ID, email, or phone. */
export function useEmployeeRecord() {
  const { user } = useAuth()
  const employees = useEmployees()
  const employee = findCurrentEmployee(employees, user)
  const employeeId = employee?.id ?? ''
  return {
    user,
    employeeId,
    employee,
  }
}
