import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationService } from '../services/notification.service'
import type { NotificationRecord } from '../types/notification.types'

export function useNotifications(identityKey: string, role: 'admin' | 'employee' = 'admin') {
  const [items, setItems] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestVersion = useRef(0)
  const activeIdentity = useRef(identityKey)
  activeIdentity.current = identityKey

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current
    if (!identityKey) {
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      setError('')
      return
    }
    try {
      const result = await notificationService.listUnread(identityKey, role)
      if (version !== requestVersion.current) return
      setItems(result.items)
      setUnreadCount(result.unreadCount)
      setError('')
    } catch (reason) {
      if (version !== requestVersion.current) return
      setError(reason instanceof Error ? reason.message : 'Unable to load notifications.')
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [identityKey])

  useEffect(() => {
    setItems([])
    setUnreadCount(0)
    setError('')
    setLoading(true)
    void refresh()
    const interval = window.setInterval(() => void refresh(), 10_000)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('hrm:data-change', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      requestVersion.current += 1
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('hrm:data-change', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [refresh])

  const markRead = useCallback(async (id: string) => {
    const requestedIdentity = identityKey
    await notificationService.markRead(id)
    if (activeIdentity.current !== requestedIdentity) return
    requestVersion.current += 1
    setItems((current) => current.filter((item) => item.id !== id))
    setUnreadCount((current) => Math.max(0, current - 1))
  }, [identityKey, role])

  const markAllRead = useCallback(async () => {
    const requestedIdentity = identityKey
    await notificationService.markAllRead(identityKey, role)
    if (activeIdentity.current !== requestedIdentity) return
    requestVersion.current += 1
    setItems([])
    setUnreadCount(0)
  }, [identityKey, role])

  return { items, unreadCount, loading, error, refresh, markRead, markAllRead }
}
