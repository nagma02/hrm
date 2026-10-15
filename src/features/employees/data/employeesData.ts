export type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dept: string
  title: string
  joinDate: string
  location: string
  status: string
  createdAt?: string
  manager?: string
  employmentType?: string
  shift?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
}

export const employees: Employee[] = [
  { id: 'E-1001', firstName: 'Jane', lastName: 'Cooper', email: 'jane.cooper@example.com', phone: '+1 555-0100', dept: 'Engineering', title: 'Software Engineer', joinDate: '2026-09-18', location: 'New York', status: 'Active', manager: 'Priya Sharma', employmentType: 'Full time', shift: 'General Office', emergencyContactName: 'Morgan Cooper', emergencyContactPhone: '+1 555-0140', dateOfBirth: '1994-05-16', gender: 'Female', address: 'New York, NY' },
  { id: 'E-1002', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '+1 555-0101', dept: 'Design', title: 'Product Designer', joinDate: '2026-09-12', location: 'London', status: 'Active', manager: 'Aisha Khan', employmentType: 'Full time', shift: 'Flexible' },
  { id: 'E-1003', firstName: 'Aisha', lastName: 'Khan', email: 'aisha.khan@example.com', phone: '+92 300-555-0102', dept: 'HR', title: 'HR Manager', joinDate: '2026-08-30', location: 'Karachi', status: 'Active', manager: 'Priya Sharma', employmentType: 'Full time', shift: 'General Office' },
  { id: 'E-1004', firstName: 'Michael', lastName: 'Smith', email: 'michael.smith@example.com', phone: '+44 20 7946 0958', dept: 'Sales', title: 'Account Executive', joinDate: '2026-08-22', location: 'London', status: 'Probation', manager: 'John Doe', employmentType: 'Full time', shift: 'Flexible' },
  { id: 'E-1005', firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@example.com', phone: '+61 2 5550 100', dept: 'Operations', title: 'Operations Lead', joinDate: '2026-07-11', location: 'Sydney', status: 'Active', manager: 'Priya Sharma', employmentType: 'Full time', shift: 'General Office' },
  { id: 'E-1006', firstName: 'Carlos', lastName: 'Reyes', email: 'carlos.reyes@example.com', phone: '+52 55 5550 200', dept: 'Engineering', title: 'DevOps Engineer', joinDate: '2026-06-03', location: 'Mexico City', status: 'Active', manager: 'Priya Sharma', employmentType: 'Full time', shift: 'Flexible' },
  { id: 'E-1007', firstName: 'Lina', lastName: 'Martinez', email: 'lina.martinez@example.com', phone: '+34 91 555 010', dept: 'Marketing', title: 'Marketing Manager', joinDate: '2026-05-14', location: 'Madrid', status: 'Inactive', manager: 'Aisha Khan', employmentType: 'Full time', shift: 'General Office' },
]
