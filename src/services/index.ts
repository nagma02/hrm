export { apiClient, refreshAuthSession } from './api-client'
export {
  clearAuthSession,
  fetchCurrentUser,
  getStoredAuthSession,
  logoutAuthSession,
  persistAuthSession,
  normalizePhoneNumber,
  requestLoginOtp,
  requestPhoneLoginOtp,
  resendLoginOtp,
  resendPhoneLoginOtp,
  verifyLoginOtp,
  verifyPhoneLoginOtp,
} from './auth.service'
