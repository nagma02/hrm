import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationMenu } from './components/NotificationMenu'
import { notificationService } from './services/notification.service'
import { navigateTo } from '@/app/router/navigation'

vi.mock('@/app/providers/use-auth', () => ({
  useAuth: () => ({ user: { id: 'admin@example.test', email: 'admin@example.test', role: 'SUPER_ADMIN' } }),
}))

vi.mock('@/app/router/navigation', () => ({ navigateTo: vi.fn() }))

vi.mock('./services/notification.service', () => ({
  notificationService: {
    listUnread: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}))

const sampleNotice = {
  id: 'notice-1',
  recipientUserId: 'admin@example.test',
  recipientRole: 'ADMIN' as const,
  type: 'LEAVE_REQUEST_SUBMITTED' as const,
  title: 'New Leave Request',
  message: 'Nagma Siddiqui submitted a Sick Leave request for 2 days (12 Oct–13 Oct); it requires review.',
  createdAt: '2026-10-10T10:00:00.000Z',
  readAt: null,
  status: 'UNREAD' as const,
  relatedEntityType: 'LEAVE_REQUEST',
  relatedEntityId: 'LR-1',
  actionUrl: '/app/leave/LR-1',
}

describe('NotificationMenu', () => {
  beforeEach(() => {
    vi.mocked(notificationService.listUnread).mockResolvedValue({ items: [sampleNotice], unreadCount: 1 })
    vi.mocked(notificationService.markRead).mockResolvedValue({ ...sampleNotice, status: 'READ', readAt: '2026-10-10T10:01:00.000Z' })
    vi.mocked(notificationService.markAllRead).mockResolvedValue({ unreadCount: 0 })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the unread count, displays the notification, and marks it read before navigation', async () => {
    render(<NotificationMenu />)
    const bell = await screen.findByRole('button', { name: 'Notifications, 1 unread' })
    expect(within(bell).getByText('1')).toBeTruthy()

    fireEvent.click(bell)
    const item = await screen.findByRole('button', { name: /New Leave Request/ })
    expect(item.textContent).toContain('requires review')
    expect(item.textContent).toContain('LR-1')

    fireEvent.click(item)
    await waitFor(() => expect(notificationService.markRead).toHaveBeenCalledWith('notice-1'))
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('/app/leave/LR-1'))
    expect(screen.queryByText('New Leave Request')).toBeNull()
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy()
  })

  it('keeps the unread badge based on all unread notifications and offers a View all action', async () => {
    const reviewNotification = {
      ...sampleNotice,
      id: 'notice-review',
      title: 'Leave review needed',
      message: 'This requires review.',
      type: 'LEAVE_REQUEST_SUBMITTED' as const,
      actionUrl: '/employee/leave/requests',
    }
    vi.mocked(notificationService.listUnread).mockResolvedValue({ items: [sampleNotice, reviewNotification], unreadCount: 2 })

    render(<NotificationMenu portal="employee" />)
    const bell = await screen.findByRole('button', { name: 'Notifications, 2 unread' })
    expect(within(bell).getByText('2')).toBeTruthy()

    fireEvent.click(bell)
    const viewAll = await screen.findByRole('button', { name: /View all notifications/i })
    fireEvent.click(viewAll)

    expect(navigateTo).toHaveBeenCalledWith('/employee/notifications')
    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeTruthy()
  })

  it('shows a caught-up state without an unread badge', async () => {
    vi.mocked(notificationService.listUnread).mockResolvedValue({ items: [], unreadCount: 0 })
    render(<NotificationMenu />)
    const bell = screen.getByRole('button', { name: 'Notifications' })
    fireEvent.click(bell)
    expect(await screen.findByText('You’re all caught up.')).toBeTruthy()
    expect(within(bell).queryByText('0')).toBeNull()
  })
})
