import { beforeEach, describe, expect, it } from 'vitest'
import { notificationService } from './notification.service'

describe('notificationService sync flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('filters role-specific notifications for employee and admin users', async () => {
    const notifications = [
      {
        id: 'NT-1',
        recipientUserId: 'ADMIN-DEMO',
        recipientRole: 'ADMIN',
        type: 'LEAVE_REQUEST_SUBMITTED',
        title: 'New leave request',
        message: 'A request requires review.',
        createdAt: '2026-10-10T10:00:00.000Z',
        readAt: null,
        status: 'UNREAD',
      },
      {
        id: 'NT-2',
        recipientUserId: 'E-1001',
        recipientRole: 'EMPLOYEE',
        type: 'LEAVE_REQUEST_APPROVED',
        title: 'Leave request approved',
        message: 'Your request was approved.',
        createdAt: '2026-10-10T10:05:00.000Z',
        readAt: null,
        status: 'UNREAD',
      },
    ]

    localStorage.setItem('hrm-notifications', JSON.stringify(notifications))

    const employeeNotifications = await notificationService.listUnread('E-1001', 'employee')
    const adminNotifications = await notificationService.listUnread('ADMIN-DEMO', 'admin')

    expect(employeeNotifications.items).toHaveLength(1)
    expect(employeeNotifications.items[0].id).toBe('NT-2')
    expect(adminNotifications.items).toHaveLength(1)
    expect(adminNotifications.items[0].id).toBe('NT-1')
  })

  it('broadcasts announcement and leave status notifications to the correct recipients', async () => {
    const announcement = await notificationService.publishAnnouncement({
      id: 'ANN-200',
      title: 'Quarterly town hall',
      description: 'Join us on Friday.',
      category: 'Company Announcement',
      priority: 'Normal',
      publishDate: '2026-10-12',
      expiryDate: '2026-10-30',
      audience: 'All employees',
      recipientIds: ['E-1001'],
      status: 'Published',
    })

    expect(announcement.created).toBe(1)

    const leaveDecision = await notificationService.notifyLeaveStatus({
      id: 'LV-200',
      employeeId: 'E-1001',
      employeeName: 'Jane Cooper',
      leaveType: 'Annual Leave',
      startDate: '2026-10-12',
      endDate: '2026-10-14',
    }, 'Approved')

    expect(leaveDecision.recipientUserId).toBe('E-1001')
    expect(leaveDecision.type).toBe('LEAVE_REQUEST_APPROVED')
  })
})
