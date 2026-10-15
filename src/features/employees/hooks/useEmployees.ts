import { useSyncExternalStore } from 'react'
import { employeeStore } from '../data/employeeStore'

export function useEmployees() {
  return useSyncExternalStore(employeeStore.subscribe, employeeStore.getSnapshot, employeeStore.getSnapshot)
}
