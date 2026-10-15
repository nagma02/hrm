import { useSyncExternalStore } from 'react'
import { hrContentStore } from '../data/hrContentStore'

export function useHRContent() {
  return useSyncExternalStore(hrContentStore.subscribe, hrContentStore.getSnapshot, hrContentStore.getSnapshot)
}
