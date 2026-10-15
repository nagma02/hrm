import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const adminSession = {
  accessToken: 'admin-token',
  user: {
    id: 'admin@example.test',
    name: 'Admin User',
    email: 'admin@example.test',
    phone: '+919876543210',
    role: 'SUPER_ADMIN',
    globalRole: 'SUPER_ADMIN',
    permissions: ['dashboard.view'],
  },
}

const employeeSession = {
  accessToken: 'employee-token',
  user: {
    id: 'employee-1',
    name: 'Jane Cooper',
    email: 'employee@company.com',
    phone: '+919900000001',
    role: 'EMPLOYEE',
    globalRole: 'EMPLOYEE',
    permissions: ['dashboard.view', 'attendance.view', 'leave.view'],
  },
}

function buildSession(identifier: string) {
  const normalized = String(identifier ?? '').trim().toLowerCase()
  if (normalized === 'employee@company.com') return { session: employeeSession, redirectTo: '/employee/dashboard' }
  return { session: adminSession, redirectTo: '/app/dashboard' }
}

export const server = setupServer(
  http.post('/api/auth/send-otp-email', async () => HttpResponse.json({ success: true, data: { ok: true } })),
  http.post('/api/auth/send-otp-sms', async () => HttpResponse.json({ success: true, data: { ok: true } })),
  http.post('/api/auth/send-otp-whatsapp', async () => HttpResponse.json({ success: true, data: { ok: true } })),
  http.post('/api/auth/verify-otp', async ({ request }) => {
    const payload = await request.json() as { identifier?: string; otp?: string }
    const { identifier, otp } = payload ?? {}

    if (!identifier || !otp || !/^\d{4}$/.test(String(otp))) {
      return HttpResponse.json({ success: false, message: 'Invalid OTP.' }, { status: 400 })
    }

    const result = buildSession(String(identifier))
    return HttpResponse.json({ success: true, data: result })
  }),
)
