import { employees as seedEmployees, type Employee } from './employeesData'

const storageKey = 'hrm-employees'
type Listener = () => void
const listeners = new Set<Listener>()

function readPersistedEmployees(): Employee[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null') as Employee[] | null
    return Array.isArray(value) ? value : seedEmployees
  } catch {
    return seedEmployees
  }
}

let snapshot = readPersistedEmployees()

function notify() { listeners.forEach((listener) => listener()); window.dispatchEvent(new Event('hrm:data-change')) }
function handleStorage(event: StorageEvent) {
  if (event.key === storageKey) { snapshot = readPersistedEmployees(); notify() }
}

export const employeeStore = {
  getSnapshot: () => snapshot,
  subscribe(listener: Listener) {
    if (listeners.size === 0) window.addEventListener('storage', handleStorage)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) window.removeEventListener('storage', handleStorage)
    }
  },
  getById(id: string) { return snapshot.find((employee) => employee.id === id) },
  save(next: Employee[]) {
    snapshot = next
    localStorage.setItem(storageKey, JSON.stringify(next))
    notify()
  },
  create(values: Omit<Employee, 'createdAt'> & { createdAt?: string }) {
    const createdAt = values.createdAt ?? new Date().toISOString()
    const employee: Employee = { ...values, createdAt, joinDate: values.joinDate || createdAt.slice(0, 10), status: values.status || 'Active' }
    this.save([employee, ...snapshot.filter((item) => item.id !== employee.id)])
    return employee
  },
}
