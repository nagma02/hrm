export const APP_NAME = 'HRM | Human Resource Management'
export const APP_STORAGE_KEYS = {
  authSession: 'hrm.auth.session',
  theme: 'hrm.theme',
  portal: 'hrm.portal',
} as const

export const APP_ROUTE_PATHS = {
  root: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  dashboard: '/app/dashboard',
  unauthorized: '/app/unauthorized',
  notFound: '/404',
} as const
