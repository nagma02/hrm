import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPortalLandingPath, isAdminPortalUser } from '@/app/auth/access'
import { verifyLoginOtp } from '@/services/auth.service'
import { leaveService } from '@/features/leave/services/leave.service'
import { notificationService } from '@/features/notifications/services/notification.service'
import { hrContentStore } from '@/features/hr-content/data/hrContentStore'

// These integration checks use the existing browser-backed adapters, not mocked services.
// They verify record-level delivery; the account/employee ID mismatch is tracked in QA-STEP2.md.
beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

const application = {
  employeeId: 'E-1001',
  employeeName: 'Jane Cooper',
  employeeEmail: 'jane.cooper@example.com',
  employeePhone: '+1 555-0100',
  leaveType: 'Casual Leave' as const,
  startDate: '2026-10-15',
  endDate: '2026-10-15',
  numberOfDays: 1,
  reason: 'Step 2 local integration verification',
}

describe('Step 2 local authentication and event flow', () => {
  it('routes Employee and Admin demo OTP sessions to their own landing pages', async () => {
    const employee = await verifyLoginOtp('jane.cooper@example.com', '1234')
    expect(isAdminPortalUser(employee.user)).toBe(false)
    expect(getPortalLandingPath(employee.user)).toBe('/employee/dashboard')
    const admin = await verifyLoginOtp('admin@company.com', '1234')
    expect(isAdminPortalUser(admin.user)).toBe(true)
    expect(getPortalLandingPath(admin.user)).toBe('/app/dashboard')
  })

  it('rejects incorrect OTPs without persisting an authenticated session', async () => {
    await expect(verifyLoginOtp('jane.cooper@example.com', '000000')).rejects.toThrow()
    expect(localStorage.getItem('hrm.auth.session')).toBeNull()
  })

  it('persists Employee leave and delivers the Admin review notification', async () => {
    await leaveService.refresh()
    const request = await leaveService.applyLeave(application)
    expect(request.status).toBe('Pending')
    expect(JSON.parse(localStorage.getItem('hrm-leave') ?? '[]')).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: request.id, reason: application.reason })]),
    )
    const admin = await notificationService.listUnread('ADMIN-DEMO', 'admin')
    expect(admin.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'LEAVE_REQUEST_SUBMITTED', relatedEntityId: request.id }),
    ]))
    expect(admin.unreadCount).toBe(1)
  })

  it('persists an Admin approval and delivers it to the employee RECORD identity', async () => {
    await leaveService.refresh()
    const request = await leaveService.applyLeave(application)
    const approved = await leaveService.updateStatus(request.id, 'Approved')
    expect(approved.status).toBe('Approved')
    expect(leaveService.getById(request.id)?.status).toBe('Approved')
    const employee = await notificationService.listUnread(application.employeeId, 'employee')
    expect(employee.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'LEAVE_REQUEST_APPROVED', relatedEntityId: request.id, message: expect.stringContaining('was Approved') }),
    ]))
  })

  it('notifies subscribed content views when an announcement is saved', async () => {
    const listener = vi.fn()
    const unsubscribe = hrContentStore.subscribe(listener)
    try {
      const announcement = {
        id: 'QA-STEP2-ANN', title: 'Step 2 announcement', description: 'Local broadcast verification',
        category: 'HR Announcement', priority: 'Normal' as const, publishDate: '2026-10-12',
        expiryDate: '', audience: 'All employees', status: 'Published' as const,
      }
      hrContentStore.saveAnnouncement(announcement)
      expect(listener).toHaveBeenCalledOnce()
      expect(hrContentStore.getSnapshot().announcements).toContainEqual(announcement)
      await notificationService.publishAnnouncement({ ...announcement, recipientIds: [application.employeeId] })
      const employee = await notificationService.listUnread(application.employeeId, 'employee')
      expect(employee.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'ANNOUNCEMENT_PUBLISHED', relatedEntityId: announcement.id }),
      ]))
    } finally { unsubscribe() }
  })

  it('broadcasts a holiday through existing local services (separate from the blocked Add UI)', async () => {
    const holiday = { id: 'QA-STEP2-HOL', name: 'Step 2 holiday', date: '2026-10-16', type: 'Company holiday', description: 'Local broadcast verification' }
    hrContentStore.saveHoliday(holiday)
    expect(hrContentStore.getSnapshot().holidays).toContainEqual(holiday)
    await notificationService.publishHoliday(holiday)
    const employee = await notificationService.listUnread(application.employeeId, 'employee')
    expect(employee.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'HOLIDAY_PUBLISHED', relatedEntityId: holiday.id }),
    ]))
  })
})
