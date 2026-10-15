export type Permission = string

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  permissions: Permission[]
  employeeId?: string
  globalRole?: string
  organizationRole?: string
  organizationId?: string
  jobTitle?: string
  department?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  profilePhoto?: string
}

export type AuthSession = {
  accessToken?: string
  refreshToken?: string
  user: User
  expiresAt?: string
}
