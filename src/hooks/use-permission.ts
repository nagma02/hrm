import { useRBAC } from '@/hooks/use-rbac'

export function usePermission(permission: string) {
  const { hasPermission } = useRBAC()

  return hasPermission(permission)
}
