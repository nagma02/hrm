import { useEffect, useMemo, useState } from 'react'
import { leaveService } from '@/features/leave/services/leave.service'
import type { LeaveApplication } from '@/features/leave/types/leave.types'
import { useAuth } from '@/app/providers/use-auth'

function visibleToUser(requests: LeaveApplication[], identity: { id: string; email: string; phone: string; role: string; globalRole: string }) {
  if (!identity.id) return []
  const role = String(identity.globalRole || identity.role).toUpperCase()
  if (['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'].includes(role)) return requests
  return requests.filter((request) => request.employeeId === identity.id
    || Boolean(identity.email && request.employeeEmail.toLowerCase() === identity.email.toLowerCase())
    || Boolean(identity.phone && request.employeePhone === identity.phone))
}

export function useLeaveApplications() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const userEmail = user?.email ?? ''
  const userPhone = user?.phone ?? ''
  const userRole = user?.role ?? ''
  const globalRole = user?.globalRole ?? ''
  const identity = useMemo(() => ({ id: userId, email: userEmail, phone: userPhone, role: userRole, globalRole }), [userId, userEmail, userPhone, userRole, globalRole])
  const [requests, setRequests] = useState<LeaveApplication[]>(() => visibleToUser(leaveService.list(), identity))

  useEffect(() => {
    let active = true
    const refresh = () => {
      void leaveService.refresh().then((next) => {
        if (active) {
          const visible = visibleToUser(next, identity)
          setRequests((current) => JSON.stringify(current) === JSON.stringify(visible) ? current : visible)
        }
      }).catch(() => {
        if (active) setRequests((current) => {
          const latest = visibleToUser(leaveService.list(), identity)
          return JSON.stringify(current) === JSON.stringify(latest) ? current : latest
        })
      })
    }
    const sync = () => setRequests(visibleToUser(leaveService.list(), identity))
    const storageSync = (event: StorageEvent) => { if (event.key === null || event.key === 'hrm-leave') sync() }
    refresh()
    const interval = window.setInterval(refresh, 10_000)
    window.addEventListener('focus', refresh)
    window.addEventListener('hrm:data-change', sync)
    window.addEventListener('storage', storageSync)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('hrm:data-change', sync)
      window.removeEventListener('storage', storageSync)
    }
  }, [identity])

  return requests
}
