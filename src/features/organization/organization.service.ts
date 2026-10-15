import { apiClient } from '@/services/api-client'

export type OrganizationMembership = {
  organizationId: string
  organizationName: string
  role: string
}

export type Organization = {
  id: string
  name: string
  role: string
  slug?: string
}

export type OrganizationEntitlements = Record<string, boolean>

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function readList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const root = asRecord(payload)
  const data = asRecord(root?.data) ?? root
  const items = data?.organizations ?? data?.items ?? data?.memberships
  return Array.isArray(items) ? items : []
}

function normalizeOrganization(value: unknown): Organization | null {
  const record = asRecord(value)
  const membership = asRecord(record?.membership)
  const organization = asRecord(record?.organization) ?? record
  const id = organization?.id ?? organization?.organizationId ?? organization?.organization_id
  const name = organization?.name ?? organization?.organizationName ?? organization?.organization_name
  if ((typeof id !== 'string' && typeof id !== 'number') || typeof name !== 'string') return null
  return {
    id: String(id),
    name,
    role: typeof record?.role === 'string'
      ? record.role
      : typeof membership?.role === 'string' ? membership.role : 'ORG_USER',
    ...(typeof organization?.slug === 'string' ? { slug: organization.slug } : {}),
  }
}

export async function listOrganizations(): Promise<Organization[]> {
  const response = await apiClient.get<unknown>('/organizations')
  return readList(response.data).map(normalizeOrganization).filter((organization): organization is Organization => Boolean(organization))
}

export async function lookupOrganizations(query: string): Promise<Organization[]> {
  const response = await apiClient.get<unknown>(`/organizations/lookup?q=${encodeURIComponent(query)}`)
  return readList(response.data).map(normalizeOrganization).filter((organization): organization is Organization => Boolean(organization))
}

export async function getOrganizationEntitlements(organizationId: string): Promise<OrganizationEntitlements> {
  const response = await apiClient.get<unknown>(`/organizations/${encodeURIComponent(organizationId)}/entitlements`)
  if (Array.isArray(response.data)) {
    return Object.fromEntries(response.data.filter((item): item is string => typeof item === 'string').map((item) => [item, true]))
  }
  const root = asRecord(response.data)
  const data = asRecord(root?.data) ?? root
  const values = asRecord(data?.entitlements) ?? data
  if (!values) return {}
  if (Array.isArray(data?.entitlements)) {
    return Object.fromEntries(data.entitlements.filter((item): item is string => typeof item === 'string').map((item) => [item, true]))
  }
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'))
}
