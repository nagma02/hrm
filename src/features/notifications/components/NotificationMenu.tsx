import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/use-auth'
import { navigateTo } from '@/app/router/navigation'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationRecord } from '../types/notification.types'
import { useCurrentEmployee } from '@/features/employees/utils/employee-identity'
import { ListSkeleton } from '@/components/ui/skeleton'

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Recently'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function safeActionPath(item: NotificationRecord, portal: 'admin' | 'employee') {
  if (!item.actionUrl) return portal === 'employee' ? '/employee/dashboard' : '/app/dashboard'
  if (item.actionUrl.startsWith(`/${portal}/`) || item.actionUrl.startsWith('/app/')) return item.actionUrl
  if (item.actionUrl.startsWith('/employee/')) return item.actionUrl
  return portal === 'employee' ? '/employee/dashboard' : '/app/dashboard'
}

function isReviewNotification(item: NotificationRecord) {
  const title = `${item.title ?? ''} ${item.message ?? ''}`.toLowerCase()
  return item.type === 'LEAVE_REQUEST_SUBMITTED' || /new leave request|requires review|leave review/i.test(title)
}

export function NotificationMenu({ portal = 'admin' }: { portal?: 'admin' | 'employee' }) {
  const { user } = useAuth()
  const employee = useCurrentEmployee()
  const identityKey = portal === 'employee'
    ? employee?.id || user?.employeeId || user?.id || user?.email || user?.phone || ''
    : user?.id || user?.email || user?.phone || ''
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications(identityKey, portal)
  const visibleItems = useMemo(() => {
    if (portal === 'employee') return items.filter((item) => !isReviewNotification(item))
    return items
  }, [items, portal])
  const visibleUnreadCount = unreadCount
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openNotification = async (item: NotificationRecord) => {
    setBusy(true)
    try {
      await markRead(item.id)
      setOpen(false)
      navigateTo(safeActionPath(item, portal))
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to mark this notification as read.')
    } finally {
      setBusy(false)
    }
  }

  const readAll = async () => {
    setBusy(true)
    try {
      await markAllRead()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Unable to update notifications.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="menu-wrap" ref={rootRef}>
      <button
        className="icon-button notification-button"
        aria-label={`Notifications${visibleUnreadCount ? `, ${visibleUnreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { setOpen((value) => !value); void refresh() }}
      >
        <Bell size={18}/>
        {visibleUnreadCount > 0 && <span className="notification-badge" aria-hidden="true">{visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}</span>}
        <span className="sr-only" aria-live="polite">{visibleUnreadCount} unread notifications</span>
      </button>
      {open && (
        <section className="pop-menu notification-menu" aria-label="Notifications" role="dialog" aria-busy={loading}>
          <div className="notification-menu-head">
            <strong>Notifications {visibleUnreadCount > 0 && <span className="notification-count">{visibleUnreadCount}</span>}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" disabled={busy} onClick={() => { setOpen(false); navigateTo(portal === 'employee' ? '/employee/notifications' : '/app/notifications') }}>
                View all notifications
              </button>
              {visibleUnreadCount > 0 && <button disabled={busy} onClick={() => void readAll()}><Check size={13}/> Mark all read</button>}
            </div>
          </div>
          {loading && !visibleItems.length && <ListSkeleton rows={4} label="Loading notifications" />}
          {error && <div className="notification-state notification-state--error"><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
          {!loading && !error && !visibleItems.length && <p className="notification-state">You’re all caught up.</p>}
          <div className="notification-list">
            {visibleItems.map((item) => (
              <button
                className="notification-item"
                key={item.id}
                disabled={busy}
                onClick={() => void openNotification(item)}
              >
                <span className="notification-item-dot" aria-label="Unread"/>
                <span className="notification-item-copy">
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                  {item.relatedEntityId && <small className="notification-related">{item.relatedEntityType?.replaceAll('_', ' ') ?? 'Request'} · {item.relatedEntityId}</small>}
                  <small>{formatDateTime(item.createdAt)}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
