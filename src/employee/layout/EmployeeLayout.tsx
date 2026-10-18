import AppLayout from '@/app/layouts/AppLayout'
import { employeeMenuItems } from '@/employee/config/menu'

export default function EmployeeLayout({ children }: { children?: React.ReactNode }) {
  return <AppLayout portal="employee" sidebarItems={employeeMenuItems}>{children}</AppLayout>
}
