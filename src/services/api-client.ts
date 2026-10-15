import { APP_STORAGE_KEYS } from '@/constants/app'
import { buildDemoUserFromPortal, DEMO_ADMIN_EMAILS, DEMO_ADMIN_PHONES, normalizeEmailAddress } from '@/services/demo-user-profile'
import type { ApiErrorShape, ApiSuccessResponse } from '@/types/api'
import type { AuthSession } from '@/types/auth'

export class ApiClientError extends Error implements ApiErrorShape {
  status: number
  code?: string
  details?: unknown

  constructor(shape: ApiErrorShape) {
    super(shape.message)
    this.name = 'ApiClientError'
    this.status = shape.status
    this.code = shape.code
    this.details = shape.details
  }
}

type RequestOptions<TBody = unknown> = { body?: TBody; signal?: AbortSignal }

const demoUsers = {
  admin: buildDemoUserFromPortal('admin@company.com', '+919876543210', 'admin'),
  employee: buildDemoUserFromPortal('nagma@company.com', '+919876543210', 'employee'),
} as const

const demoLeaveRequests = [
  { id: 'LV-1024', employeeId: 'E-1001', employeeName: 'Jane Cooper', employeeEmail: 'jane.cooper@example.com', leaveType: 'Annual Leave', startDate: '2026-10-10', endDate: '2026-10-14', numberOfDays: 5, reason: 'Family trip', status: 'Pending', appliedDate: '2026-10-01' },
  { id: 'LV-1023', employeeId: 'E-1003', employeeName: 'Aisha Khan', employeeEmail: 'aisha.khan@example.com', leaveType: 'Sick Leave', startDate: '2026-10-07', endDate: '2026-10-08', numberOfDays: 2, reason: 'Medical appointment', status: 'Approved', appliedDate: '2026-10-01' },
  { id: 'LV-1022', employeeId: 'E-1006', employeeName: 'Carlos Reyes', employeeEmail: 'carlos.reyes@example.com', leaveType: 'Casual Leave', startDate: '2026-10-03', endDate: '2026-10-03', numberOfDays: 1, reason: 'Personal', status: 'Rejected', appliedDate: '2026-10-01' },
]

let refreshPromise: Promise<AuthSession> | null = null

function readStoredSession() {
  if (typeof window === 'undefined') return null
  const serialized = window.localStorage.getItem(APP_STORAGE_KEYS.authSession)
    ?? window.sessionStorage.getItem(APP_STORAGE_KEYS.authSession)
  if (!serialized) return null
  try { return JSON.parse(serialized) as AuthSession } catch { return null }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

function extractRefreshPayload(responseData: unknown) {
  const root = asRecord(responseData)
  if (root?.success === false) throw new Error(typeof root.message === 'string' ? root.message : 'Session refresh failed.')
  const data = asRecord(root?.data) ?? root
  const sessionData = asRecord(data?.session) ?? data
  const accessToken = firstString(sessionData?.accessToken, sessionData?.access_token, sessionData?.token)
  if (!accessToken) throw new Error('Session refresh did not return an access token.')
  return {
    accessToken,
    refreshToken: firstString(sessionData?.refreshToken, sessionData?.refresh_token),
    expiresAt: firstString(sessionData?.expiresAt, sessionData?.expires_at),
    expiresIn: sessionData?.expiresIn ?? sessionData?.expires_in,
  }
}

async function refreshStoredSession(): Promise<AuthSession> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const current = readStoredSession() ?? {
      accessToken: 'demo-token-EMP-1001',
      refreshToken: 'demo-refresh-EMP-1001',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: demoUsers.employee,
    }
    const refreshed: AuthSession = {
      ...current,
      accessToken: current.accessToken || `demo-token-${current.user.id}`,
      refreshToken: current.refreshToken || `demo-refresh-${current.user.id}`,
      expiresAt: current.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: {
        ...current.user,
        permissions: [...current.user.permissions],
      },
    }
    const remember = Boolean(window.localStorage.getItem(APP_STORAGE_KEYS.authSession))
    const destination = remember ? window.localStorage : window.sessionStorage
    const other = remember ? window.sessionStorage : window.localStorage
    destination.setItem(APP_STORAGE_KEYS.authSession, JSON.stringify(refreshed))
    other.removeItem(APP_STORAGE_KEYS.authSession)
    window.dispatchEvent(new CustomEvent('hrm:session-refreshed', { detail: refreshed }))
    return refreshed
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function getDemoList(key: string, fallback: unknown) {
  try {
    const stored = window.localStorage.getItem(key)
    const parsed = stored ? JSON.parse(stored) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

function demoFallbackFor(path: string, method: string, body?: unknown) {
  const request = asRecord(body)
  const email = typeof request?.email === 'string' ? request.email : ''
  const phone = typeof request?.phone === 'string' ? request.phone : ''
  const storedSession = readStoredSession()

  if (path === '/auth/send-otp' || path === '/auth/send-phone-otp' || path === '/auth/send-sms-otp') {
    return { success: true, message: 'Demo OTP ready.', data: { devOtp: '1234' } } as ApiSuccessResponse<unknown>
  }

  if (path === '/auth/verify-otp' || path === '/auth/verify-phone-otp' || path === '/auth/verify-sms-otp') {
    const isPhoneLogin = path !== '/auth/verify-otp'
    const normalizedPhone = phone.replace(/\D/g, '')
    const adminEmail = DEMO_ADMIN_EMAILS.has(normalizeEmailAddress(email)) || /admin|hr/.test(email.toLowerCase())
    const adminPhone = isPhoneLogin && [...DEMO_ADMIN_PHONES].some((value) => value.replace(/\D/g, '') === normalizedPhone)
    const isAdminLogin = adminEmail || adminPhone
    const user = isAdminLogin
      ? buildDemoUserFromPortal(email || demoUsers.admin.email, phone, 'admin')
      : buildDemoUserFromPortal(email || 'nagma@company.com', phone || '+919876543210', 'employee')
    const session: AuthSession = {
      accessToken: `demo-token-${user.id}`,
      refreshToken: `demo-refresh-${user.id}`,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: {
        ...user,
        ...(phone ? { phone } : {}),
        email: user.email,
        permissions: [...user.permissions],
      },
    }
    window.localStorage.setItem(APP_STORAGE_KEYS.authSession, JSON.stringify(session))
    return { success: true, message: 'Demo authentication succeeded.', data: session } as ApiSuccessResponse<unknown>
  }

  if (path === '/auth/me') {
    return { success: true, message: 'Demo profile loaded.', data: storedSession?.user ?? demoUsers.employee } as ApiSuccessResponse<unknown>
  }

  if (path === '/auth/refresh') {
    const next = storedSession ?? {
      accessToken: 'demo-token-EMP-1001',
      refreshToken: 'demo-refresh-EMP-1001',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      user: demoUsers.employee,
    }
    return { success: true, message: 'Demo session refreshed.', data: { session: next } } as ApiSuccessResponse<unknown>
  }

  if (path === '/leave-requests') {
    if (method === 'GET') {
      const rows = getDemoList('hrm-leave', demoLeaveRequests) as Array<Record<string, unknown>>
      return { success: true, message: 'Demo leave requests loaded.', data: rows } as ApiSuccessResponse<unknown>
    }
    if (method === 'POST') {
      const rows = getDemoList('hrm-leave', demoLeaveRequests) as Array<Record<string, unknown>>
      const next = [{ id: `LR-${Date.now()}`, employeeId: demoUsers.employee.id, employeeName: demoUsers.employee.name, employeeEmail: demoUsers.employee.email, ...(body as Record<string, unknown>), status: 'Pending', appliedDate: new Date().toISOString().slice(0, 10) }, ...rows]
      window.localStorage.setItem('hrm-leave', JSON.stringify(next))
      return { success: true, message: 'Leave request submitted.', data: next[0] } as ApiSuccessResponse<unknown>
    }
  }

  if (path.startsWith('/leave-requests/')) {
    const rows = getDemoList('hrm-leave', demoLeaveRequests) as Array<Record<string, unknown>>
    const id = path.split('/').filter(Boolean)[1]
    if (method === 'PATCH' || method === 'PUT') {
      const current = rows.find((row) => row.id === id) ?? rows[0]
      const next = rows.map((row) => row.id === (current?.id ?? id) ? { ...row, ...(body as Record<string, unknown>), status: String((body as Record<string, unknown>)?.status ?? row.status) } : row)
      window.localStorage.setItem('hrm-leave', JSON.stringify(next))
      return { success: true, message: 'Demo leave status updated.', data: next.find((row) => row.id === (current?.id ?? id)) ?? next[0] } as ApiSuccessResponse<unknown>
    }
  }

  if (path.startsWith('/notifications')) {
    const storedNotifications = getDemoList('hrm-notifications', []) as Array<Record<string, unknown>>
    const current = [...new Map(storedNotifications.map((item) => [String(item.id ?? ''), item])).values()]
    const query = path.includes('?') ? new URLSearchParams(path.slice(path.indexOf('?') + 1)) : new URLSearchParams()
    const recipient = query.get('recipient') ?? ''
    const role = (query.get('role') ?? '').toLowerCase()
    const filtered = current.filter((item) => {
      const recordRole = String(item.recipientRole ?? 'EMPLOYEE').toLowerCase()
      const matchesRole = !role || recordRole === role || (role === 'admin' && recordRole === 'admin') || (role === 'employee' && recordRole === 'employee')
      const recipientId = String(item.recipientUserId ?? '').toLowerCase()
      const matchesRecipient = !recipient || recipientId === recipient.toLowerCase()
        || (role === 'employee' && recipientId === 'all-employees')
        || (role === 'admin' && recipientId === 'all-admins')
      return matchesRole && matchesRecipient
    })
    if (method === 'GET') {
      return { success: true, message: 'Demo notifications loaded.', data: { items: filtered, unreadCount: filtered.filter((item) => item.read !== true && item.status !== 'READ').length } } as ApiSuccessResponse<unknown>
    }
    if (path.startsWith('/notifications') && method === 'POST' && !path.includes('/read') && !path.startsWith('/notifications/read-all')) {
      const notification = {
        id: String((body as Record<string, unknown>)?.id ?? `NT-${Date.now()}`),
        recipientUserId: String((body as Record<string, unknown>)?.recipientUserId ?? 'ADMIN-DEMO'),
        recipientRole: String((body as Record<string, unknown>)?.recipientRole ?? 'EMPLOYEE').toUpperCase(),
        type: (body as Record<string, unknown>)?.type ?? 'ANNOUNCEMENT_PUBLISHED',
        title: String((body as Record<string, unknown>)?.title ?? 'Notification'),
        message: String((body as Record<string, unknown>)?.message ?? 'New update available.'),
        createdAt: String((body as Record<string, unknown>)?.createdAt ?? new Date().toISOString()),
        readAt: (body as Record<string, unknown>)?.readAt ?? null,
        status: String((body as Record<string, unknown>)?.status ?? 'UNREAD'),
        relatedEntityType: (body as Record<string, unknown>)?.relatedEntityType ?? undefined,
        relatedEntityId: (body as Record<string, unknown>)?.relatedEntityId ?? undefined,
        relatedEntityData: (body as Record<string, unknown>)?.relatedEntityData ?? undefined,
        actionUrl: (body as Record<string, unknown>)?.actionUrl ?? '/app/dashboard',
      }
      const next = [notification, ...current.filter((item) => String(item.id ?? '') !== notification.id)]
      window.localStorage.setItem('hrm-notifications', JSON.stringify(next))
      return { success: true, message: 'Notification created.', data: next[0] } as ApiSuccessResponse<unknown>
    }
    if (path.startsWith('/notifications/read-all')) {
      const next = current.map((item) => ({ ...item, read: true, status: 'READ' }))
      window.localStorage.setItem('hrm-notifications', JSON.stringify(next))
      return { success: true, message: 'All notifications marked read.', data: { unreadCount: 0 } } as ApiSuccessResponse<unknown>
    }
    if (path.includes('/read')) {
      const id = path.split('/').filter(Boolean)[1]
      const next = current.map((item) => item.id === id ? { ...item, read: true, status: 'READ' } : item)
      window.localStorage.setItem('hrm-notifications', JSON.stringify(next))
      return { success: true, message: 'Notification marked read.', data: next.find((item) => item.id === id) ?? next[0] } as ApiSuccessResponse<unknown>
    }
  }

  if (path === '/organizations' || path.startsWith('/organizations/')) {
    return { success: true, message: 'Frontend-only organization data.', data: [] } as ApiSuccessResponse<unknown>
  }

  if (path === '/ai/chat') {
    return { success: true, message: 'AI response generated locally.', data: { response: 'This is a frontend demo response generated without backend access.', suggestions: ['Review attendance', 'Check payroll status', 'Summarize leave trends'] } } as ApiSuccessResponse<unknown>
  }

  if (path === '/attendance-corrections' || path.startsWith('/attendance-corrections/')) {
    const rows = getDemoList('hrm-attendance-corrections', []) as Array<Record<string, unknown>>
    if (method === 'GET') return { success: true, message: 'Demo attendance corrections loaded.', data: rows } as ApiSuccessResponse<unknown>
    if (method === 'POST') {
      const next = [{ id: `AC-${Date.now()}`, ...(body as Record<string, unknown>), status: 'Pending' }, ...rows]
      window.localStorage.setItem('hrm-attendance-corrections', JSON.stringify(next))
      return { success: true, message: 'Correction submitted.', data: next[0] } as ApiSuccessResponse<unknown>
    }
  }

  return { success: true, message: 'Demo fallback response.', data: null } as ApiSuccessResponse<unknown>
}

async function request<TData, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> & { method?: string } = {},
): Promise<ApiSuccessResponse<TData>> {
  const { body, method = 'GET' } = options
  return demoFallbackFor(path, method.toUpperCase(), body) as ApiSuccessResponse<TData>
}

export const apiClient = {
  get: <TData>(path: string, signal?: AbortSignal) =>
    request<TData>(path, { method: 'GET', signal }),
  post: <TData, TBody = unknown>(path: string, body?: TBody, config: RequestOptions<TBody> = {}) =>
    request<TData, TBody>(path, { ...config, method: 'POST', body }),
  put: <TData, TBody = unknown>(path: string, body?: TBody) =>
    request<TData, TBody>(path, { method: 'PUT', body }),
  patch: <TData, TBody = unknown>(path: string, body?: TBody) =>
    request<TData, TBody>(path, { method: 'PATCH', body }),
  delete: <TData>(path: string) => request<TData>(path, { method: 'DELETE' }),
}

export function refreshAuthSession() {
  return refreshStoredSession()
}
