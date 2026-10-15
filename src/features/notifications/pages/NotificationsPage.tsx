import { useEffect, useMemo, useState } from 'react'
import { CheckCheck, Clock3, MailWarning } from 'lucide-react'
import { useAuth } from '@/app/providers/use-auth'
import { navigateTo } from '@/app/router/navigation'
import { notificationService } from '@/features/notifications/services/notification.service'
import type { NotificationRecord } from '@/features/notifications/types/notification.types'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function NotificationsPage({ portal = 'admin' }: { portal?: 'admin' | 'employee' }) {
  const { user } = useAuth()
  const identityKey = portal === 'employee'
    ? user?.employeeId || user?.id || user?.email || user?.phone || ''
    : user?.id || user?.email || user?.phone || ''
  const [items, setItems] = useState<NotificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (!identityKey) {
      setItems([])
      setLoading(false)
      return
    }

    let ignore = false
    setLoading(true)
    void notificationService.listUnread(identityKey, portal).then((result) => {
      if (ignore) return
      setItems(result.items)
      setLoading(false)
    }).catch(() => {
      if (ignore) return
      setItems([])
      setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [identityKey, portal])

  const filteredItems = useMemo(() => {
    const selected = items.filter((item) => {
      if (filter === 'unread') return item.status !== 'READ'
      if (filter === 'read') return item.status === 'READ'
      return true
    })
    return [...selected].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [filter, items])

  const unreadCount = items.filter((item) => item.status !== 'READ').length

  const handleOpen = async (item: NotificationRecord) => {
    if (item.status !== 'READ') {
      await notificationService.markRead(item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: 'READ', readAt: new Date().toISOString() } : entry))
    }
    if (item.actionUrl) {
      navigateTo(item.actionUrl)
    }
  }

  const markAllRead = async () => {
    await notificationService.markAllRead(identityKey, portal)
    setItems((current) => current.map((item) => ({ ...item, status: 'READ', readAt: item.readAt ?? new Date().toISOString() })))
  }

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'} waiting for review.` : 'You are all caught up.'}
        actions={
          <button className="button button--secondary" type="button" onClick={() => void markAllRead()} disabled={!unreadCount || !identityKey}>
            <CheckCheck size={15} /> Mark all read
          </button>
        }
      />

      <section className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['read', 'Read'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`button ${filter === value ? 'button--primary' : 'button--secondary'}`}
              onClick={() => setFilter(value as 'all' | 'unread' | 'read')}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state"><Clock3 size={16} /> Loading notifications…</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state"><MailWarning size={16} /> No notifications match this view.</div>
        ) : (
          <div className="table-scroll">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button type="button" className="link-button" onClick={() => void handleOpen(item)}>
                        {item.title}
                      </button>
                      <div style={{ color: 'var(--color-muted)', marginTop: 4 }}>{item.message}</div>
                    </td>
                    <td>{item.type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (match) => match.toUpperCase())}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <span className={`status-pill ${item.status === 'READ' ? 'status-pill--success' : 'status-pill--warning'}`}>
                        {item.status === 'READ' ? 'Read' : 'Unread'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  )
}
