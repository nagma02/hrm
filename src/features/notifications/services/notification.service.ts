import { employeeStore } from '@/features/employees/data/employeeStore'
import { apiClient } from '@/services/api-client'
import type { NotificationListResponse, NotificationRecord, NotificationType } from '../types/notification.types'

type NotificationRole = 'admin' | 'employee'
const localStorageKey = 'hrm-notifications'

type NotificationInput = Omit<NotificationRecord, 'createdAt' | 'readAt' | 'status'> & {
  createdAt?: string
  readAt?: string | null
  status?: NotificationRecord['status']
  recipientRole?: NotificationRecord['recipientRole']
}

function buildNotificationQuery(identityKey?: string, role?: NotificationRole) {
  const query = new URLSearchParams()
  if (identityKey) query.set('recipient', identityKey)
  if (role) query.set('role', role)
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

function buildNotificationRecord(input: NotificationInput): NotificationRecord {
  return {
    id: input.id,
    recipientUserId: input.recipientUserId,
    recipientRole: input.recipientRole ?? 'EMPLOYEE',
    type: input.type,
    title: input.title,
    message: input.message,
    createdAt: input.createdAt ?? new Date().toISOString(),
    readAt: input.readAt ?? null,
    status: input.status ?? 'UNREAD',
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    relatedEntityData: input.relatedEntityData,
    actionUrl: input.actionUrl,
  }
}

function localNotifications() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(localStorageKey) ?? '[]')
    return Array.isArray(value) ? uniqueNotifications(value as NotificationRecord[]) : []
  } catch { return [] }
}

function uniqueNotifications(items: NotificationRecord[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item?.id) return false
    const key = item.relatedEntityId
      ? `${item.recipientUserId}:${item.type}:${item.relatedEntityId}`
      : item.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function saveLocalNotifications(items: NotificationRecord[]) {
  const uniqueItems = uniqueNotifications(items)
  localStorage.setItem(localStorageKey, JSON.stringify(uniqueItems))
  window.dispatchEvent(new Event('hrm:data-change'))
  return uniqueItems
}

function localList(identityKey?: string, role?: NotificationRole): NotificationListResponse {
  const roleName = role === 'admin' ? 'ADMIN' : 'EMPLOYEE'
  const items = localNotifications().filter((item) =>
    (!role || !item.recipientRole || item.recipientRole === roleName)
      && (!identityKey || item.recipientUserId === identityKey
        || (role === 'employee' && item.recipientUserId === 'ALL-EMPLOYEES')
        || (role === 'admin' && item.recipientUserId === 'ALL-ADMINS')),
  ).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  return { items, unreadCount: items.filter((item) => item.status === 'UNREAD' && !item.readAt).length }
}

export const notificationService = {
  async listUnread(identityKey?: string, role?: NotificationRole) {
    try {
      const response = await apiClient.get<NotificationListResponse>(`/notifications${buildNotificationQuery(identityKey, role)}`)
      const items = uniqueNotifications(response.data.items ?? [])
      return { items, unreadCount: items.filter((item) => item.status === 'UNREAD' && !item.readAt).length }
    } catch { return localList(identityKey, role) }
  },
  async markRead(id: string) {
    const current = localNotifications().find((item) => item.id === id)
    if (current) saveLocalNotifications(localNotifications().map((item) => item.id === id ? { ...item, readAt: new Date().toISOString(), status: 'READ' } : item))
    try {
      const response = await apiClient.patch<NotificationRecord>(`/notifications/${encodeURIComponent(id)}/read`)
      return response.data
    } catch {
      if (!current) throw new Error('Notification was not found.')
      return { ...current, readAt: new Date().toISOString(), status: 'READ' }
    }
  },
  async markAllRead(identityKey?: string, role?: NotificationRole) {
    const list = localList(identityKey, role)
    const ids = new Set(list.items.map((item) => item.id))
    saveLocalNotifications(localNotifications().map((item) => ids.has(item.id) ? { ...item, readAt: new Date().toISOString(), status: 'READ' } : item))
    try {
      const response = await apiClient.patch<{ unreadCount: number }>(`/notifications/read-all${buildNotificationQuery(identityKey, role)}`)
      return response.data
    } catch { return { unreadCount: 0 } }
  },
  async create(record: NotificationInput) {
    const next = buildNotificationRecord(record)
    saveLocalNotifications([next, ...localNotifications().filter((item) => item.id !== next.id)])
    try {
      const response = await apiClient.post<NotificationRecord, NotificationRecord>('/notifications', next)
      return response.data
    } catch { return next }
  },
  async notifyLeaveRequestSubmitted(leave: { id: string; employeeId: string; employeeName: string; leaveType: string; startDate: string; endDate: string }) {
    return this.create({
      id: `NT-LEAVE-SUBMITTED-${leave.id}`,
      recipientUserId: 'ALL-ADMINS',
      recipientRole: 'ADMIN',
      type: 'LEAVE_REQUEST_SUBMITTED' as NotificationType,
      title: 'New leave request',
      message: `${leave.employeeName} submitted a ${leave.leaveType} request for ${leave.startDate} to ${leave.endDate}. It requires review.`,
      relatedEntityType: 'LEAVE_REQUEST',
      relatedEntityId: leave.id,
      actionUrl: '/app/leave',
    })
  },
  async notifyLeaveStatus(leave: { id: string; employeeId: string; employeeName: string; leaveType: string; startDate: string; endDate: string }, status: 'Approved' | 'Rejected') {
    const verdict = status === 'Approved' ? 'Approved' : 'Rejected'
    return this.create({
      id: `NT-LEAVE-${status.toUpperCase()}-${leave.id}`,
      recipientUserId: leave.employeeId,
      recipientRole: 'EMPLOYEE',
      type: status === 'Approved' ? ('LEAVE_REQUEST_APPROVED' as NotificationType) : ('LEAVE_REQUEST_REJECTED' as NotificationType),
      title: `Leave request ${verdict.toLowerCase()}`,
      message: `Your ${leave.leaveType.toLowerCase()} request for ${leave.startDate} to ${leave.endDate} was ${verdict}.`,
      relatedEntityType: 'LEAVE_REQUEST',
      relatedEntityId: leave.id,
      actionUrl: '/employee/leave',
    })
  },
  async publishAnnouncement(announcement: {
    id: string
    title: string
    description: string
    category: string
    priority: 'Low' | 'Normal' | 'High'
    publishDate: string
    expiryDate: string
    audience: string
    recipientIds?: string[]
    status: 'Published'
  }) {
    const recipients = announcement.recipientIds?.length ? announcement.recipientIds : ['ALL-EMPLOYEES']
    const created = await Promise.all(recipients.map((recipientId, index) => this.create({
      id: `NT-ANNOUNCEMENT-${announcement.id}-${recipientId || index}`,
      recipientUserId: recipientId,
      recipientRole: 'EMPLOYEE',
      type: 'ANNOUNCEMENT_PUBLISHED' as NotificationType,
      title: announcement.title,
      message: `${announcement.title}: ${announcement.description}`,
      relatedEntityType: 'ANNOUNCEMENT',
      relatedEntityId: announcement.id,
      actionUrl: `/employee/announcements?announcement=${encodeURIComponent(announcement.id)}`,
      relatedEntityData: { category: announcement.category, audience: announcement.audience, priority: announcement.priority },
    })))
    return { created: created.length, items: created }
  },
  async publishHoliday(holiday: { id: string; name: string; date: string; type: string; description: string }) {
    const recipients = employeeStore.getSnapshot().map((employee) => employee.id)
    const created = await Promise.all(recipients.map((recipientId, index) => this.create({
      id: `NT-HOLIDAY-${holiday.id}-${recipientId || index}`,
      recipientUserId: recipientId,
      recipientRole: 'EMPLOYEE',
      type: 'HOLIDAY_PUBLISHED' as NotificationType,
      title: 'New holiday added',
      message: `${holiday.name} is scheduled for ${holiday.date}.`,
      relatedEntityType: 'HOLIDAY',
      relatedEntityId: holiday.id,
      actionUrl: '/employee/holidays',
      relatedEntityData: { holidayName: holiday.name, holidayDate: holiday.date, holidayType: holiday.type },
    })))
    return { created: created.length, items: created }
  },
  async getPublishedAnnouncement(id: string) {
    const response = await apiClient.get<{
      id: string
      title: string
      description: string
      category: string
      priority: 'Low' | 'Normal' | 'High'
      publishDate: string
      expiryDate: string
      audience: string
    }>(`/notifications/announcements/${encodeURIComponent(id)}`)
    return response.data
  },
}
