import { ListSkeleton } from '@/components/ui/skeleton'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <div className="state state--loading"><ListSkeleton rows={3} label={label} /></div>
}
