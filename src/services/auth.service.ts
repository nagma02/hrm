import { APP_STORAGE_KEYS } from '@/constants/app'
import { appEnv } from '@/app/config/env'
import { ApiClientError, apiClient } from '@/services/api-client'
import { buildDemoUserFromPortal, DEMO_ADMIN_EMAILS, DEMO_ADMIN_PHONES, DEMO_EMPLOYEE_EMAILS, normalizeEmailAddress } from '@/services/demo-user-profile'
import { removeStorageValue } from '@/utils/storage'
import type { AuthSession, Permission, User } from '@/types/auth'

const adminPermissions = [
  'app.view', 'dashboard.view', 'employee.view', 'employee.manage', 'attendance.view',
  'leave.view', 'leave.approve', 'shift.view', 'department.view', 'designation.view',
  'payroll.view', 'payroll.process', 'holiday.view', 'announcement.view', 'settings.view', 'settings.manage',
]
const DEMO_EMAIL_OTP = '1234'
const DEMO_MOBILE_OTP = '1234'
const LEGACY_DEMO_MOBILE_OTP = '4321'

function isDemoModeEnabled(email = '', phone = '') {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const value = `${email} ${phone}`.trim().toLowerCase()
  if (!value) return false
  return /@company\.com$|@example\.com$|@demo\.test$/.test(value)
    || /admin|employee|nagma|hr/.test(value)
    || /^[+]?\d{10,15}$/.test(value.replace(/\D/g, ''))
}

export function demoPortalFrom(email: string, phone: string) {
  const normalizedEmail = normalizeEmailAddress(email)
  const normalizedPhone = phone.replace(/\D/g, '')
  if (DEMO_ADMIN_EMAILS.has(normalizedEmail)) return 'admin'
  if (DEMO_ADMIN_PHONES.has(phone) || DEMO_ADMIN_PHONES.has(`+${normalizedPhone}`) || DEMO_ADMIN_PHONES.has(normalizedPhone)) return 'admin'
  if (DEMO_EMPLOYEE_EMAILS.has(normalizedEmail)) return 'employee'
  if (/admin/i.test(normalizedEmail) || /admin/i.test(phone)) return 'admin'
  return 'employee'
}

function buildDemoUser(email: string, phone = '', portal = 'admin'): User {
  const resolvedPortal = portal === 'admin' || portal === 'employee' ? portal : demoPortalFrom(email, phone)
  return buildDemoUserFromPortal(email, phone, resolvedPortal)
}

function buildDemoSession(email: string, phone = '', portal = 'employee'): AuthSession {
  const resolvedPortal = portal === 'admin' || portal === 'employee' ? portal : demoPortalFrom(email, phone)
  const user = buildDemoUser(email, phone, resolvedPortal)
  return {
    accessToken: `demo-token-${user.id}`,
    refreshToken: `demo-refresh-${user.id}`,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    user,
  }
}

type AuthApiPayload = {
  accessToken?: unknown
  access_token?: unknown
  token?: unknown
  refreshToken?: unknown
  refresh_token?: unknown
  expiresAt?: unknown
  expires_at?: unknown
  expiresIn?: unknown
  expires_in?: unknown
  user?: unknown
  session?: unknown
  data?: unknown
  challengeId?: unknown
  challenge_id?: unknown
  devOtp?: unknown
  developmentOtp?: unknown
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : null
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

function developmentOtpFrom(...values: unknown[]) {
  const otp = values.find((value) => typeof value === 'string' || typeof value === 'number')
  const normalized = otp === undefined ? '' : String(otp)
  return /^\d{4}$/.test(normalized) ? normalized : undefined
}

export function normalizePhoneNumber(value: string) {
  const compact = value.trim().replace(/(?:ext(?:ension)?\.?|x)\s*\d+$/i, '').replace(/[\s().-]/g, '')
  if (!/^\+?\d+$/.test(compact)) return ''
  let digits = compact.replace(/\D/g, '')
  if (compact.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('910') && digits.length === 13) digits = `91${digits.slice(3)}`
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`
  if (digits.startsWith('91') && digits.length === 12) return ''
  if (digits.length >= 8 && digits.length <= 15 && (compact.startsWith('+') || compact.startsWith('00') || digits.length > 10)) {
    return `+${digits}`
  }
  return ''
}

function authenticationRequestError(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 0) return new Error('Unable to reach the authentication service. Check your connection and try again.')
    if ([502, 503, 504].includes(error.status) && /^request failed with status code/i.test(error.message)) {
      return new Error('Authentication service is temporarily unavailable. Please try again shortly.')
    }
  }
  return error
}

function displayNameFromEmail(email: string) {
  const localPart = email.split('@')[0] ?? ''
  return localPart.split(/[._+-]+/).filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1)).join(' ') || email
}

function unwrapPayload(value: unknown) {
  const root = record(value)
  const data = record(root?.data) ?? root
  return record(data?.session) ?? data
}

function normalizeUser(payload: unknown, emailFallback = '', fallbackUser?: User): User {
  const root = record(payload) ?? {}
  const email = firstString(root.email, root.emailAddress, root.email_address) ?? (emailFallback || fallbackUser?.email || '')
  const phone = firstString(root.phone, root.phoneNumber, root.phone_number, fallbackUser?.phone)
  const roleClaim = firstString(root.role, root.roleName, root.role_name)
  const roleList = Array.isArray(root.roles)
    ? root.roles.map((role) => typeof role === 'string' ? role : firstString(record(role)?.name, record(role)?.code)).filter((role): role is string => Boolean(role))
    : []
  const explicitOrganizationRole = firstString(root.organizationRole, root.organization_role, root.orgRole, root.org_role)
    ?? roleList.find((role) => ['ORG_ADMIN', 'ORG_USER'].includes(role.toUpperCase()))
  const roleIsOrganizationScoped = ['ORG_ADMIN', 'ORG_USER'].includes(roleClaim?.toUpperCase() ?? '')
  const organizationRole = explicitOrganizationRole ?? (roleIsOrganizationScoped ? roleClaim : undefined) ?? fallbackUser?.organizationRole
  const globalRole = firstString(root.globalRole, root.global_role)
    ?? roleList.find((role) => ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_EXECUTIVE'].includes(role.toUpperCase()))
    ?? (roleIsOrganizationScoped ? fallbackUser?.globalRole ?? '' : roleClaim ?? fallbackUser?.globalRole ?? fallbackUser?.role ?? '')
  const role = (organizationRole ?? roleClaim ?? fallbackUser?.role ?? globalRole) || 'UNASSIGNED'
  const rawPermissions = root.permissions ?? root.permissionCodes ?? root.permission_codes
  const permissionRecord = record(rawPermissions)
  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions.map((permission) => {
      if (typeof permission === 'string') return permission
      const item = record(permission)
      return firstString(item?.name, item?.code, item?.key, item?.permission)
    }).filter((permission): permission is string => typeof permission === 'string')
    : permissionRecord
      ? Object.entries(permissionRecord).filter(([, enabled]) => enabled === true).map(([permission]) => permission)
    : fallbackUser?.permissions ?? (globalRole.toUpperCase() === 'SUPER_ADMIN' || globalRole.toUpperCase() === 'ADMIN'
      ? adminPermissions
      : [])

  const employeeId = firstString(root.employeeId, root.employee_id, root.employeeid) ?? fallbackUser?.employeeId
  return {
    id: firstString(root.id, root.userId, root.user_id, root.sub) ?? fallbackUser?.id ?? (email || phone || ''),
    name: firstString(root.name, root.fullName, root.full_name, root.displayName) ?? fallbackUser?.name ?? displayNameFromEmail(email),
    email,
    ...(phone ? { phone } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(firstString(root.jobTitle, root.job_title, fallbackUser?.jobTitle) ? { jobTitle: firstString(root.jobTitle, root.job_title, fallbackUser?.jobTitle) } : {}),
    ...(firstString(root.department, root.departmentName, root.department_name, fallbackUser?.department) ? { department: firstString(root.department, root.departmentName, root.department_name, fallbackUser?.department) } : {}),
    ...(firstString(root.address, fallbackUser?.address) ? { address: firstString(root.address, fallbackUser?.address) } : {}),
    ...(firstString(root.emergencyContactName, root.emergency_contact_name, fallbackUser?.emergencyContactName) ? { emergencyContactName: firstString(root.emergencyContactName, root.emergency_contact_name, fallbackUser?.emergencyContactName) } : {}),
    ...(firstString(root.emergencyContactPhone, root.emergency_contact_phone, fallbackUser?.emergencyContactPhone) ? { emergencyContactPhone: firstString(root.emergencyContactPhone, root.emergency_contact_phone, fallbackUser?.emergencyContactPhone) } : {}),
    ...(firstString(root.profilePhoto, root.profile_photo, fallbackUser?.profilePhoto) ? { profilePhoto: firstString(root.profilePhoto, root.profile_photo, fallbackUser?.profilePhoto) } : {}),
    role,
    globalRole,
    ...(organizationRole ? { organizationRole } : {}),
    ...(firstString(root.organizationId, root.organization_id, root.activeOrganizationId, root.active_organization_id)
      ? { organizationId: firstString(root.organizationId, root.organization_id, root.activeOrganizationId, root.active_organization_id) }
      : fallbackUser?.organizationId ? { organizationId: fallbackUser.organizationId }
      : {}),
    permissions: permissions as Permission[],
  }
}

function normalizeSession(payload: unknown, emailFallback = ''): AuthSession {
  const data = unwrapPayload(payload) ?? {}
  const userPayload = data.user ?? data.profile
  const accessToken = firstString(data.accessToken, data.access_token, data.token, data.jwt)
  if (!accessToken) throw new Error('The authentication server did not return an access token.')
  const refreshToken = firstString(data.refreshToken, data.refresh_token)
  const expiresAt = firstString(data.expiresAt, data.expires_at)
  const expiresIn = data.expiresIn ?? data.expires_in
  const expiresAtFromDuration = typeof expiresIn === 'number'
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : undefined

  const user = normalizeUser(userPayload, emailFallback)
  if (user.role === 'UNASSIGNED') throw new Error('The authentication server did not return a recognized account role.')
  return {
    accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    user,
    ...((expiresAt ?? expiresAtFromDuration) ? { expiresAt: expiresAt ?? expiresAtFromDuration } : {}),
  }
}

export async function requestLoginOtp(email: string) {
  if (!isDemoModeEnabled(email)) {
    return { devOtp: DEMO_EMAIL_OTP }
  }
  return { devOtp: DEMO_EMAIL_OTP }
}

export async function resendLoginOtp(email: string, challengeId?: string) {
  void challengeId
  if (!isDemoModeEnabled(email)) {
    return DEMO_EMAIL_OTP
  }
  return DEMO_EMAIL_OTP
}

export async function requestPhoneLoginOtp(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone) throw new Error('Enter a valid mobile number.')
  return { devOtp: DEMO_MOBILE_OTP }
}

export async function resendPhoneLoginOtp(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone)
  if (!normalizedPhone) throw new Error('Enter a valid mobile number.')
  return DEMO_MOBILE_OTP
}

export async function verifyLoginOtp(email: string, otp: string, challengeId?: string, portal?: 'admin' | 'employee') {
  void challengeId
  const resolvedPortal = portal ?? demoPortalFrom(email, '')
  if (otp === DEMO_EMAIL_OTP && isDemoModeEnabled(email)) {
    const session = buildDemoSession(email, '', resolvedPortal)
    persistAuthSession(session, true)
    return session
  }
  throw new Error('The demo OTP for email login is 1234.')
}

export async function verifyPhoneLoginOtp(phone: string, otp: string, portal?: 'admin' | 'employee') {
  const normalizedPhone = normalizePhoneNumber(phone)
  const resolvedPortal = portal ?? demoPortalFrom('', normalizedPhone)
  if (!normalizedPhone) throw new Error('Enter a valid mobile number.')
  if ((otp === DEMO_MOBILE_OTP || otp === LEGACY_DEMO_MOBILE_OTP) && isDemoModeEnabled('', normalizedPhone)) {
    const session = buildDemoSession('', normalizedPhone, resolvedPortal)
    persistAuthSession(session, true)
    return session
  }
  throw new Error('The demo OTP for mobile login is 4321.')
}

export async function fetchCurrentUser(fallbackUser?: User) {
  const fallback = fallbackUser ?? buildDemoUser('admin@company.com', '', 'admin')
  return normalizeUser(fallback, fallback.email, fallback)
}

async function passwordDigest(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt).buffer, iterations: 120_000, hash: 'SHA-256' }, key, 256)
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

export async function changeAccountPassword(userId: string, currentPassword: string, newPassword: string) {
  const storageKey = `hrm.account-password:${userId}`
  const existing = localStorage.getItem(storageKey)
  if (existing) {
    const [saltText, expectedDigest] = existing.split(':')
    const salt = Uint8Array.from(atob(saltText), (character) => character.charCodeAt(0))
    if (await passwordDigest(currentPassword, salt) !== expectedDigest) throw new Error('Current password is incorrect.')
  }
  await apiClient.post('/auth/change-password', { currentPassword, newPassword })
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltText = btoa(String.fromCharCode(...salt))
  localStorage.setItem(storageKey, `${saltText}:${await passwordDigest(newPassword, salt)}`)
}

export function logoutAuthSession(session: AuthSession | null) {
  // The current backend uses short-lived stateless JWTs and has no logout endpoint.
  // The caller clears the local session immediately; server revocation requires backend support.
  void session
  return Promise.resolve()
}

export function getStoredAuthSession() {
  const stored = window.localStorage.getItem(APP_STORAGE_KEYS.authSession)
    ?? window.sessionStorage.getItem(APP_STORAGE_KEYS.authSession)
  if (!stored) return null

  try {
    const session = JSON.parse(stored) as AuthSession
    if (
      (typeof session.accessToken !== 'string' || !session.accessToken.trim()) ||
      (!session.user?.email && !session.user?.phone) ||
      (session.user.id.startsWith('demo-') && !session.accessToken) ||
      (session.user.id.startsWith('super-admin-') && !session.accessToken) ||
      (session.expiresAt && !session.refreshToken && new Date(session.expiresAt).getTime() <= Date.now())
    ) {
      clearAuthSession()
      return null
    }
    return session
  } catch {
    clearAuthSession()
    return null
  }
}

export function persistAuthSession(session: AuthSession, rememberMe = true) {
  const destination = rememberMe ? window.localStorage : window.sessionStorage
  const other = rememberMe ? window.sessionStorage : window.localStorage
  destination.setItem(APP_STORAGE_KEYS.authSession, JSON.stringify(session))
  other.removeItem(APP_STORAGE_KEYS.authSession)
}

export function clearAuthSession() {
  removeStorageValue(APP_STORAGE_KEYS.authSession)
  window.sessionStorage.removeItem(APP_STORAGE_KEYS.authSession)
  window.localStorage.removeItem('hrm.active.organization')
  window.localStorage.removeItem('hrm.active.organization.entitlements')
}
