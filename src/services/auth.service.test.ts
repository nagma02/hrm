import { describe, expect, it } from 'vitest'
import { getPortalLandingPath, isAdminPortalUser } from '@/app/auth/access'
import { normalizePhoneNumber, verifyLoginOtp, verifyPhoneLoginOtp } from './auth.service'

describe('demo login portal detection', () => {
  it('routes employee email sign-ins to the employee portal', async () => {
    const session = await verifyLoginOtp('employee@company.com', '1234')
    expect(session.user.globalRole).toBe('EMPLOYEE')
    expect(isAdminPortalUser(session.user)).toBe(false)
    expect(getPortalLandingPath(session.user)).toBe('/employee/dashboard')
    expect(session.user.permissions).toEqual(expect.arrayContaining(['dashboard.view']))
  })

  it('routes admin email sign-ins to the admin portal', async () => {
    const session = await verifyLoginOtp('admin@company.com', '1234')
    expect(session.user.globalRole).toBe('SUPER_ADMIN')
    expect(isAdminPortalUser(session.user)).toBe(true)
    expect(getPortalLandingPath(session.user)).toBe('/app/dashboard')
    expect(session.user.permissions).toEqual(expect.arrayContaining(['dashboard.view']))
  })

  it('routes mobile OTP sign-ins to the admin portal', async () => {
    const session = await verifyPhoneLoginOtp('+919876543210', '4321')
    expect(session.user.globalRole).toBe('SUPER_ADMIN')
    expect(isAdminPortalUser(session.user)).toBe(true)
    expect(getPortalLandingPath(session.user)).toBe('/app/dashboard')
  })
})

describe('demo employee identity mapping', () => {
  it('maps employee demo logins to a real employee record', async () => {
    const session = await verifyLoginOtp('nagma@company.com', '1234')
    expect(session.user.name).toBe('Jane Cooper')
    expect(session.user.email).toBe('jane.cooper@example.com')
    expect(session.user.id).toBe('E-1001')
  })
})

describe('normalizePhoneNumber', () => {
  it.each([
    ['98765 43210', '+919876543210'],
    ['91 (98765) 43210', '+919876543210'],
    ['+91 098765-43210', '+919876543210'],
    ['0091.98765.43210', '+919876543210'],
    ['+44 (20) 7946 0958', '+442079460958'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected)
  })

  it.each(['', '12345', 'abc9876543210', '+91 12345 67890', '++919876543210'])('rejects invalid input %s', (input) => {
    expect(normalizePhoneNumber(input)).toBe('')
  })
})
