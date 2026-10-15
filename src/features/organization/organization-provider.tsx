import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers/use-auth'
import { getOrganizationEntitlements, listOrganizations, lookupOrganizations } from './organization.service'
import type { Organization, OrganizationEntitlements } from './organization.service'
import { OrganizationContext } from './organization-context'
import type { OrganizationContextValue } from './organization-context'

const ACTIVE_ORGANIZATION_KEY = 'hrm.active.organization'
const EMPTY_ORGANIZATIONS: Organization[] = []
const EMPTY_ENTITLEMENTS: OrganizationEntitlements = {}

function readActiveOrganizationId() {
  try { return window.localStorage.getItem(ACTIVE_ORGANIZATION_KEY) ?? '' } catch { return '' }
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth()
  const userId = user?.id
  const userOrganizationId = user?.organizationId
  const requestKey = userId ? `${userId}:${session?.accessToken ?? ''}` : ''
  const [organizationResult, setOrganizationResult] = useState<{ userId: string; items: Organization[] } | null>(null)
  const [activeOrganizationId, setActiveOrganizationId] = useState(readActiveOrganizationId)
  const [entitlementResult, setEntitlementResult] = useState<{ userId: string; organizationId: string; values: OrganizationEntitlements } | null>(null)
  const [loadedRequestKey, setLoadedRequestKey] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)
  const [loadError, setLoadError] = useState<{ requestKey: string; message: string } | null>(null)
  const organizations = organizationResult && organizationResult.userId === userId ? organizationResult.items : EMPTY_ORGANIZATIONS
  const entitlements = entitlementResult && entitlementResult.userId === userId && entitlementResult.organizationId === activeOrganizationId
    ? entitlementResult.values
    : EMPTY_ENTITLEMENTS
  const isLoading = Boolean(requestKey && loadedRequestKey !== requestKey)
  const error = loadError?.requestKey === requestKey ? loadError.message : ''

  useEffect(() => {
    if (!userId) return
    let active = true
    listOrganizations().then(async (items) => {
      if (!active) return
      setOrganizationResult({ userId, items })
      const stored = readActiveOrganizationId()
      const preferred = userOrganizationId || stored
      const chosen = items.find((organization) => organization.id === preferred) ?? items[0]
      if (!chosen) {
        setActiveOrganizationId('')
        return
      }
      setActiveOrganizationId(chosen.id)
      try { window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, chosen.id) } catch { /* Active context still works for this session. */ }
      const nextEntitlements = await getOrganizationEntitlements(chosen.id)
      if (active) setEntitlementResult({ userId, organizationId: chosen.id, values: nextEntitlements })
    }).catch((loadError: unknown) => {
      if (active) setLoadError({ requestKey, message: loadError instanceof Error ? loadError.message : 'Unable to load organizations.' })
    }).finally(() => {
      if (active) setLoadedRequestKey(requestKey)
    })
    return () => { active = false }
  }, [requestKey, userId, userOrganizationId])

  const switchOrganization = useCallback(async (organizationId: string) => {
    const organization = organizations.find((item) => item.id === organizationId)
    if (!organization || organization.id === activeOrganizationId) return
    const previousId = activeOrganizationId
    const previousEntitlements = entitlements
    setIsSwitching(true)
    setLoadError(null)
    setActiveOrganizationId(organization.id)
    try { window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, organization.id) } catch { /* Active context still works for this session. */ }
    window.dispatchEvent(new Event('hrm:organization-change'))
    try {
      const nextEntitlements = await getOrganizationEntitlements(organization.id)
      if (userId) setEntitlementResult({ userId, organizationId: organization.id, values: nextEntitlements })
    } catch (switchError) {
      setActiveOrganizationId(previousId)
      if (userId && previousId) setEntitlementResult({ userId, organizationId: previousId, values: previousEntitlements })
      if (previousId) {
        try { window.localStorage.setItem(ACTIVE_ORGANIZATION_KEY, previousId) } catch { /* Ignore unavailable storage. */ }
      } else {
        try { window.localStorage.removeItem(ACTIVE_ORGANIZATION_KEY) } catch { /* Ignore unavailable storage. */ }
      }
      setLoadError({ requestKey, message: switchError instanceof Error ? switchError.message : 'Unable to switch organization.' })
    } finally {
      setIsSwitching(false)
    }
  }, [activeOrganizationId, entitlements, organizations, requestKey, userId])

  const activeOrganization = organizations.find((organization) => organization.id === activeOrganizationId) ?? null
  const lookup = useCallback((query: string) => lookupOrganizations(query), [])
  const value = useMemo<OrganizationContextValue>(() => ({
    organizations,
    activeOrganization,
    entitlements,
    isLoading,
    isSwitching,
    error,
    switchOrganization,
    lookupOrganizations: lookup,
    hasEntitlement: (entitlement) => entitlements[entitlement] === true,
  }), [organizations, activeOrganization, entitlements, isLoading, isSwitching, error, switchOrganization, lookup])

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>
}
