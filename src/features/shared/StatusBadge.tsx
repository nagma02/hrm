import { StatusDotBadge } from '@/components/tables/StatusDotBadge'

/** Employee status pill; delegates to the shared dot badge so every table speaks one status language. */
export default function StatusBadge({ status }: { status: string }) {
  return <StatusDotBadge status={status} variant={status === 'On Leave' ? 'leave' : undefined} />
}
