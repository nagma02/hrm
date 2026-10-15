import { AuthProvider } from './auth-provider'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { OrganizationProvider } from '@/features/organization/organization-provider'
import { seedEmployeeDemoData } from '@/employee/data/employeeDemoSeed'
import { ThemeProvider } from './theme-provider'

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => { seedEmployeeDemoData() }, [])
  return <ThemeProvider><AuthProvider><OrganizationProvider>{children}</OrganizationProvider></AuthProvider></ThemeProvider>
}
