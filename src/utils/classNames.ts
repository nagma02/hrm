import { cn } from '@/lib/utils'

export function classNames(...values: Array<string | false | null | undefined>) {
  return cn(...values)
}