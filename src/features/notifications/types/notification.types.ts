export type NotificationType =
  | 'LEAVE_REQUEST_SUBMITTED'
  | 'LEAVE_REQUEST_APPROVED'
  | 'LEAVE_REQUEST_REJECTED'
  | 'LEAVE_REQUEST_CANCELLED'
  | 'ATTENDANCE_CORRECTION_REQUESTED'
  | 'ATTENDANCE_CORRECTION_RESOLVED'
  | 'PAYROLL_PROCESSED'
  | 'PAYSLIP_AVAILABLE'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'HOLIDAY_PUBLISHED'

export type NotificationRecord = {
  id: string
  recipientUserId: string
  recipientRole?: 'ADMIN' | 'EMPLOYEE'
  type: NotificationType
  title: string
  message: string
  createdAt: string
  readAt: string | null
  status: 'UNREAD' | 'READ' | 'ARCHIVED'
  relatedEntityType?: string
  relatedEntityId?: string
  relatedEntityData?: Record<string, unknown>
  actionUrl?: string
}

export type NotificationListResponse = {
  items: NotificationRecord[]
  unreadCount: number
}
