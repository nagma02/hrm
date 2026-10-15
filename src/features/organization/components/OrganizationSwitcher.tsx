import { Building2 } from 'lucide-react'
import { useOrganization } from '../use-organization'

export default function OrganizationSwitcher() {
  const { organizations, activeOrganization, isSwitching, switchOrganization } = useOrganization()
  if (!organizations.length) return null

  return (
    <label className="organization-switcher">
      <Building2 size={15} aria-hidden="true" />
      <span className="sr-only">Active organization</span>
      <select
        aria-label="Active organization"
        value={activeOrganization?.id ?? ''}
        disabled={isSwitching}
        onChange={(event) => { void switchOrganization(event.target.value) }}
      >
        {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
      </select>
    </label>
  )
}
