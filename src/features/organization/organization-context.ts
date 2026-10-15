import { createContext } from 'react'
import type { Organization, OrganizationEntitlements } from './organization.service'

export type OrganizationContextValue = {
  organizations: Organization[]
  activeOrganization: Organization | null
  entitlements: OrganizationEntitlements
  isLoading: boolean
  isSwitching: boolean
  error: string
  switchOrganization: (organizationId: string) => Promise<void>
  lookupOrganizations: (query: string) => Promise<Organization[]>
  hasEntitlement: (entitlement: string) => boolean
}

export const OrganizationContext = createContext<OrganizationContextValue | null>(null)
