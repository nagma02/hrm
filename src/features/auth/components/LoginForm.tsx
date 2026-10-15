import { useEffect, useState } from 'react'
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { authSchema } from '@/schemas/auth.schema'
import { useAuth } from '@/app/providers/use-auth'
import { LoginFooter } from '@/features/auth/components/LoginFooter'
import { normalizePhoneNumber } from '@/services/auth.service'
import { postApi } from '@/services/api'
import type { AuthSession } from '@/types/auth'

type LoginMode = 'email' | 'phone'
type OtpChannel = 'email' | 'sms' | 'whatsapp'

type PersistedLoginState = {
  loginMode: LoginMode
  form: {
    email: string
    phone: string
    otp: string
    identifierError: string
    authError: string
  }
  otpSent: boolean
  otpChannel: OtpChannel
  otpStatus: string
  resendCountdown: number
  acceptedTerms: boolean
}

const LOGIN_FORM_STORAGE_KEY = 'hrm.login.form.state'

const emptyFormState = {
  email: '',
  phone: '',
  otp: '',
  identifierError: '',
  authError: '',
}

function readPersistedLoginState(): PersistedLoginState | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(LOGIN_FORM_STORAGE_KEY)
    if (!rawValue) {
      return null
    }

    return JSON.parse(rawValue) as PersistedLoginState
  } catch {
    return null
  }
}

function clearPersistedLoginState() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(LOGIN_FORM_STORAGE_KEY)
  }
}

export function LoginForm() {
  const { acceptSession } = useAuth()
  const navigate = useNavigate()
  const persistedState = readPersistedLoginState()
  const [loginMode, setLoginMode] = useState<LoginMode>(persistedState?.loginMode ?? 'email')
  const [form, setForm] = useState({ ...emptyFormState, ...(persistedState?.form ?? {}) })
  const [otpSent, setOtpSent] = useState(persistedState?.otpSent ?? false)
  const [otpChannel, setOtpChannel] = useState<OtpChannel>(persistedState?.otpChannel ?? 'email')
  const [sendingChannel, setSendingChannel] = useState<OtpChannel | null>(null)
  const [otpStatus, setOtpStatus] = useState(persistedState?.otpStatus ?? '')
  const [resendCountdown, setResendCountdown] = useState(persistedState?.resendCountdown ?? 0)
  const [acceptedTerms, setAcceptedTerms] = useState(persistedState?.acceptedTerms ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (!otpSent || resendCountdown === 0) return
    const timer = window.setInterval(() => setResendCountdown((remaining) => Math.max(0, remaining - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [otpSent, resendCountdown])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const nextState: PersistedLoginState = {
      loginMode,
      form,
      otpSent,
      otpChannel,
      otpStatus,
      resendCountdown,
      acceptedTerms,
    }

    window.sessionStorage.setItem(LOGIN_FORM_STORAGE_KEY, JSON.stringify(nextState))
  }, [acceptedTerms, form, loginMode, otpChannel, otpSent, otpStatus, resendCountdown])

  const sendOtp = async (channel: OtpChannel = loginMode === 'email' ? 'email' : 'sms') => {
    setForm((current) => ({ ...current, identifierError: '', authError: '' }))
    setOtpStatus('')
    let recipient = ''
    if (loginMode === 'email') {
      const result = authSchema.shape.email.safeParse(form.email.trim())
      if (!result.success) {
        setForm((current) => ({ ...current, identifierError: 'Enter a valid work email address.' }))
        return
      }
      recipient = result.data
    } else {
      recipient = normalizePhoneNumber(form.phone)
      if (!recipient) {
        setForm((current) => ({ ...current, identifierError: 'Enter a valid 10-digit mobile number, including its country code if needed.' }))
        return
      }
    }
    setIsSubmitting(true)
    setSendingChannel(channel)
    try {
      if (channel === 'email') {
        await postApi('/api/auth/send-otp-email', { email: recipient })
        setForm((current) => ({ ...current, email: recipient }))
      } else {
        const path = channel === 'sms' ? '/api/auth/send-otp-sms' : '/api/auth/send-otp-whatsapp'
        await postApi(path, { mobile: recipient })
        setForm((current) => ({ ...current, phone: recipient }))
      }
      setForm((current) => ({ ...current, otp: '' }))
      setAcceptedTerms(false)
      setOtpChannel(channel)
      setOtpSent(true)
      const channelLabel = channel === 'email' ? 'email' : channel === 'sms' ? 'mobile by SMS' : 'mobile by WhatsApp'
      setOtpStatus(`If your account is registered, an OTP has been sent to your ${channelLabel}.`)
      toast.success(`OTP sent to your ${channelLabel}.`)
      setResendCountdown(30)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start sign in. Please try again.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
    } finally {
      setSendingChannel(null)
      setIsSubmitting(false)
    }
  }

  const resendOtp = async () => {
    setForm((current) => ({ ...current, authError: '' }))
    setIsResending(true)
    try {
      const identifier = otpChannel === 'email' ? form.email : form.phone
      const path = otpChannel === 'email'
        ? '/api/auth/send-otp-email'
        : otpChannel === 'sms' ? '/api/auth/send-otp-sms' : '/api/auth/send-otp-whatsapp'
      await postApi(path, otpChannel === 'email' ? { email: identifier } : { mobile: identifier })
      setAcceptedTerms(false)
      setForm((current) => ({ ...current, otp: '' }))
      const channelLabel = otpChannel === 'email' ? 'email' : otpChannel === 'sms' ? 'mobile by SMS' : 'mobile by WhatsApp'
      setOtpStatus(`If your account is registered, an OTP has been sent to your ${channelLabel}.`)
      toast.success(`OTP sent to your ${channelLabel}.`)
      setResendCountdown(30)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend OTP. Please try again.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  const changeCredentials = () => {
    setOtpSent(false)
    setAcceptedTerms(false)
    setForm((current) => ({ ...current, otp: '', authError: '' }))
    setOtpStatus('')
    setResendCountdown(0)
  }

  const clearLoginFormOnSuccess = () => {
    clearPersistedLoginState()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!otpSent) {
      if (loginMode === 'phone') {
        setForm((current) => ({ ...current, authError: form.phone.trim()
          ? 'Choose SMS or WhatsApp to continue.'
          : 'Enter a valid 10-digit mobile number, including its country code if needed.' }))
        return
      }
      await sendOtp()
      return
    }

    setForm((current) => ({ ...current, authError: '' }))
    if (!acceptedTerms) {
      const message = 'Please accept the Terms of Use and Privacy Policy to continue.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
      return
    }
    if (!/^\d{4}$/.test(form.otp)) {
      setForm((current) => ({ ...current, authError: `Enter the 4-digit OTP sent to your ${loginMode === 'email' ? 'email' : 'mobile number'}.` }))
      return
    }
    setIsSubmitting(true)
    try {
      const identifier = loginMode === 'email' ? form.email : form.phone
      const { session, redirectTo } = await postApi<{ session: AuthSession; redirectTo: string }>(
        '/api/auth/verify-otp',
        { identifier, otp: form.otp },
      )
      acceptSession(session)
      clearLoginFormOnSuccess()
      const destination = redirectTo
      navigate(destination, { replace: true })
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', destination)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify OTP. Please try again.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-column">
      <section className="login-form-panel !min-h-[520px] !flex !flex-col !justify-between transition-all duration-300 ease-in-out" aria-labelledby="login-title">
        <div className="login-form-content">
          <div className="upgrate-logo-mini" aria-label="Upgrate logo">
            <span className="upgrate-logo-mini__green">up</span>
            <span className="upgrate-logo-mini__gold">grate</span>
            <svg className="upgrate-logo-mini__arrow" viewBox="0 0 220 120" aria-hidden="true">
              <path d="M10 92 L82 92 L146 36 L186 36 L186 52 L220 52 L220 12 L184 12 L184 28 L132 28 L72 84 L10 84 Z" />
            </svg>
          </div>
          <div className="auth-screen__eyebrow">Welcome back</div>
          <h2 id="login-title" className="auth-screen__title">Sign in to your account</h2>
          <p className="auth-screen__description">{otpSent ? `Enter the one-time password sent to your ${loginMode === 'email' ? 'work email' : 'mobile number'}.` : 'Sign in securely with a one-time password.'}</p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            {!otpSent && (
              <div className="login-mode-toggle" role="tablist" aria-label="Choose sign-in method">
                <button type="button" role="tab" aria-selected={loginMode === 'email'} className={loginMode === 'email' ? 'is-active' : ''} onClick={() => { setLoginMode('email'); setForm((current) => ({ ...current, identifierError: '', authError: '' })) }}><Mail size={15}/> Email</button>
                <button type="button" role="tab" aria-selected={loginMode === 'phone'} className={loginMode === 'phone' ? 'is-active' : ''} onClick={() => { setLoginMode('phone'); setForm((current) => ({ ...current, identifierError: '', authError: '' })) }}><ShieldCheck size={15}/> Mobile Number</button>
              </div>
            )}
            <div className="login-field">
              <div className="login-field-heading">
                <label htmlFor="login-identifier">{loginMode === 'email' ? 'Work Email' : 'Work Mobile Number'}</label>
                {otpSent && <button type="button" className="login-change-email" onClick={changeCredentials}>Change</button>}
              </div>
              <div className={`login-input-wrap ${form.identifierError ? 'has-error' : ''}`}>
                {loginMode === 'email' ? <Mail size={17} aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                <input
                  id="login-identifier"
                  type={loginMode === 'email' ? 'email' : 'tel'}
                  inputMode={loginMode === 'phone' ? 'tel' : undefined}
                  autoComplete={loginMode === 'email' ? 'email' : 'tel'}
                  placeholder={loginMode === 'email' ? 'you@company.com' : '+91 98765 43210'}
                  value={loginMode === 'email' ? form.email : form.phone}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, [loginMode]: event.target.value, identifierError: '' }))
                  }}
                  disabled={otpSent}
                  aria-invalid={Boolean(form.identifierError)}
                  aria-describedby={form.identifierError ? 'login-identifier-error' : undefined}
                />
              </div>
              {form.identifierError && <span id="login-identifier-error" className="field-error" role="alert">{form.identifierError}</span>}
            </div>

            {otpStatus && <p className="login-otp-status" role="status">{otpStatus}</p>}

            {otpSent && (
              <div className="login-field login-otp-field">
                {loginMode === 'phone' && <div className="login-phone-verify-heading">
                  <h3>Verify One-Time Password</h3>
                  <p>Enter the 4-digit code sent by {otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to {form.phone}.</p>
                </div>}
                <div className="login-field-heading">
                  <label htmlFor="login-otp">Enter OTP (4 Digit)</label>
                  <button className="login-resend-otp" type="button" onClick={() => void resendOtp()} disabled={resendCountdown > 0 || isResending || isSubmitting}>
                    {resendCountdown > 0 ? `Resend OTP in 00:${String(resendCountdown).padStart(2, '0')}` : 'Resend OTP'}
                  </button>
                </div>
                <div className="login-input-wrap">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 4-digit OTP"
                    value={form.otp}
                    maxLength={4}
                    autoFocus={loginMode === 'phone' && otpSent}
                    onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    aria-describedby="login-otp-hint"
                  />
                </div>
                <span id="login-otp-hint" className="login-otp-hint">
                  {loginMode === 'email' ? 'Enter the 4-digit code from your work email.' : `Enter the 4-digit code sent by ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`}
                </span>
              </div>
            )}

            {otpSent && (
              <div className="login-consent-block">
                <p className="login-consent">
                  By signing up, you agree to our{' '}
                  <Link to="/terms-of-use">Terms of Use</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy">Privacy Policy</Link>.
                </p>
                <label className="login-consent-checkbox">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    aria-label="I agree to the Terms of Use and Privacy Policy"
                  />
                  <span>I agree to the Terms of Use and Privacy Policy.</span>
                </label>
              </div>
            )}

            {form.authError && <p className="login-error" role="alert"><ShieldCheck size={16}/>{form.authError}</p>}
            {!otpSent && loginMode === 'phone' ? (form.phone.trim() ? (
              <div className="login-phone-delivery">
                <div className="login-phone-delivery__buttons">
                  <button type="button" className="button login-phone-delivery__button" onClick={() => void sendOtp('sms')} disabled={!normalizePhoneNumber(form.phone) || isSubmitting || isResending}>
                    {sendingChannel === 'sms' ? <><span className="login-spinner"/> Sending OTP…</> : 'Send via SMS'}
                  </button>
                  <button type="button" className="button button--primary login-phone-delivery__button" onClick={() => void sendOtp('whatsapp')} disabled={!normalizePhoneNumber(form.phone) || isSubmitting || isResending}>
                    {sendingChannel === 'whatsapp' ? <><span className="login-spinner"/> Sending OTP…</> : 'WhatsApp'}
                  </button>
                </div>
              </div>
            ) : null) : (
              <button type="submit" className="button button--primary login-submit" disabled={otpSent ? !acceptedTerms || isSubmitting || isResending : isSubmitting || isResending}>
                {isResending ? <><span className="login-spinner"/> Sending OTP…</> : isSubmitting ? <><span className="login-spinner"/> {otpSent ? 'Verifying…' : 'Sending OTP…'}</> : <>{otpSent ? loginMode === 'phone' ? 'Verify & Continue' : 'Verify OTP & Login' : 'Send OTP'} <ArrowRight size={16}/></>}
              </button>
            )}
          </form>

          <div className="login-security-note"><ShieldCheck size={14}/> Your account details are handled securely.</div>
          <LoginFooter />
        </div>
      </section>
    </div>
  )
}
