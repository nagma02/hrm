import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react'
import { detectDialCountry, detectDialCountryFromDigits, hasInternationalPrefix, INDIA, stripDialCode, type DialCountry } from '@/features/auth/utils/dial-codes'
import { CountryDialPicker } from '@/features/auth/components/CountryDialPicker'
import { Link, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { getPortalLandingPath } from '@/app/auth/access'
import { authSchema } from '@/schemas/auth.schema'
import { useAuth } from '@/app/providers/use-auth'
import { LoginFooter } from '@/features/auth/components/LoginFooter'
import {
  normalizePhoneNumber,
  requestLoginOtp,
  requestPhoneLoginOtp,
  resendLoginOtp,
  resendPhoneLoginOtp,
  verifyLoginOtp,
  verifyPhoneLoginOtp,
} from '@/services/auth.service'

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
  devOtp: string
  otpChannel: OtpChannel
  otpStatus: string
  resendCountdown: number
}

const LOGIN_FORM_STORAGE_KEY = 'hrm.login.form.state'

const emptyFormState = {
  email: '',
  phone: '',
  otp: '',
  identifierError: '',
  authError: '',
}

function detectLoginMode(value: string): LoginMode {
  if (!value.trim()) return 'email'
  return /[a-z@]/i.test(value) ? 'email' : 'phone'
}

function stripIndiaDialCode(value: string) {
  return value
    .replace(/^\s*\+91(?:\s*)/, '')
    .replace(/^\s*91\s+/, '')
    .trimStart()
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
  const [form, setForm] = useState(() => {
    const persisted = persistedState?.form ?? emptyFormState
    return {
      ...emptyFormState,
      ...persisted,
      phone: stripIndiaDialCode(persisted.phone ?? ''),
      authError: '',
    }
  })
  const [dialCountry, setDialCountry] = useState<DialCountry>(() => detectDialCountry(form.phone) ?? INDIA)
  // True when the flag came from what was typed (not the picker), so clearing the field resets it.
  const dialCountryDetected = useRef(false)
  // Local part shown in the input; the dial code is shown by the picker label.
  const localPhone = (value: string, country: DialCountry) =>
    country === INDIA ? stripIndiaDialCode(value) : stripDialCode(value, country)
  // India keeps storing the bare local number (normalizePhoneNumber adds +91);
  // other countries store +<code><number>, which normalizePhoneNumber accepts as-is.
  const composePhone = (local: string, country: DialCountry) =>
    country === INDIA || !local ? local : `+${country.dialCode}${local.replace(/^0+/, '')}`
  const displayedPhone = localPhone(form.phone, dialCountry)
  const selectDialCountry = (country: DialCountry) => {
    const local = localPhone(form.phone, dialCountry)
    dialCountryDetected.current = false
    setDialCountry(country)
    setForm((current) => ({ ...current, phone: composePhone(local, country), identifierError: '', authError: '' }))
    requestAnimationFrame(() => phoneInputRef.current?.focus())
  }
  const [otpSent, setOtpSent] = useState(persistedState?.otpSent ?? false)
  const [devOtp, setDevOtp] = useState(persistedState?.devOtp ?? '')
  const [otpChannel, setOtpChannel] = useState<OtpChannel>(persistedState?.otpChannel ?? 'email')
  const [sendingChannel, setSendingChannel] = useState<OtpChannel | null>(null)
  const [otpStatus, setOtpStatus] = useState(persistedState?.otpStatus ?? '')
  const [resendCountdown, setResendCountdown] = useState(persistedState?.resendCountdown ?? 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const phoneInputRef = useRef<HTMLInputElement | null>(null)

  const movePhoneCursorToEnd = () => {
    const input = phoneInputRef.current
    if (!input || loginMode !== 'phone') return
    const selectionIndex = input.value.length
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(selectionIndex, selectionIndex)
    })
  }

  const setOtpCode = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 4)
    setForm((current) => ({ ...current, otp: sanitized }))
  }

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const nextDigit = rawValue.replace(/\D/g, '').slice(-1)
    const nextOtp = [...form.otp.padEnd(4, '')]
    nextOtp[index] = nextDigit
    const combined = nextOtp.join('').replace(/\D/g, '').slice(0, 4)
    setForm((current) => ({ ...current, otp: combined }))
    if (nextDigit && index < 3) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      otpInputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < 3) {
      event.preventDefault()
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!pasted) return
    event.preventDefault()
    setOtpCode(pasted)
    const focusIndex = Math.min(pasted.length, 3)
    otpInputRefs.current[focusIndex]?.focus()
  }

  useEffect(() => {
    if (!otpSent || resendCountdown === 0) return
    const timer = window.setInterval(
      () => setResendCountdown((remaining) => Math.max(0, remaining - 1)),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [otpSent, resendCountdown])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const nextState: PersistedLoginState = {
      loginMode,
      form: { ...form, authError: '' },
      otpSent,
      devOtp,
      otpChannel,
      otpStatus,
      resendCountdown,
    }

    window.sessionStorage.setItem(LOGIN_FORM_STORAGE_KEY, JSON.stringify(nextState))
  }, [devOtp, form, loginMode, otpChannel, otpSent, otpStatus, resendCountdown])

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
        setForm((current) => ({
          ...current,
          identifierError:
            'Enter a valid 10-digit mobile number, including its country code if needed.',
        }))
        return
      }
    }
    setIsSubmitting(true)
    setSendingChannel(channel)
    try {
      if (channel === 'email') {
        const result = await requestLoginOtp(recipient)
        setDevOtp(result.devOtp)
        setForm((current) => ({ ...current, email: recipient }))
      } else {
        const result = await requestPhoneLoginOtp(recipient)
        setDevOtp(result.devOtp)
        setForm((current) => ({ ...current, phone: stripIndiaDialCode(recipient) }))
      }
      setForm((current) => ({ ...current, otp: '' }))
      setOtpChannel(channel)
      setOtpSent(true)
      const channelLabel =
        channel === 'email' ? 'email' : channel === 'sms' ? 'mobile by SMS' : 'mobile by WhatsApp'
      setOtpStatus(`If your account is registered, an OTP has been sent to your ${channelLabel}.`)
      toast.success(`OTP sent to your ${channelLabel}.`)
      setResendCountdown(30)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to start sign in. Please try again.'
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
      const code =
        otpChannel === 'email'
          ? await resendLoginOtp(form.email)
          : await resendPhoneLoginOtp(form.phone)
      setDevOtp(code)
      setForm((current) => ({ ...current, otp: '' }))
      const channelLabel =
        otpChannel === 'email'
          ? 'email'
          : otpChannel === 'sms'
            ? 'mobile by SMS'
            : 'mobile by WhatsApp'
      setOtpStatus(`If your account is registered, an OTP has been sent to your ${channelLabel}.`)
      toast.success(`OTP sent to your ${channelLabel}.`)
      setResendCountdown(30)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to resend OTP. Please try again.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  const changeCredentials = () => {
    setOtpSent(false)
    setDevOtp('')
    setForm((current) => ({
      ...current,
      otp: '',
      authError: '',
      phone: stripIndiaDialCode(current.phone),
    }))
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
        setForm((current) => ({
          ...current,
          authError: form.phone.trim()
            ? 'Choose SMS or WhatsApp to continue.'
            : 'Enter a valid 10-digit mobile number, including its country code if needed.',
        }))
        return
      }
      await sendOtp()
      return
    }

    setForm((current) => ({ ...current, authError: '' }))
    if (!/^\d{4}$/.test(form.otp)) {
      setForm((current) => ({
        ...current,
        authError: `Enter the 4-digit OTP sent to your ${loginMode === 'email' ? 'email' : 'mobile number'}.`,
      }))
      return
    }
    setIsSubmitting(true)
    try {
      const session =
        loginMode === 'email'
          ? await verifyLoginOtp(form.email, form.otp)
          : await verifyPhoneLoginOtp(form.phone, form.otp)
      acceptSession(session)
      clearLoginFormOnSuccess()
      const destination = getPortalLandingPath(session.user)
      navigate(destination, { replace: true })
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', destination)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to verify OTP. Please try again.'
      setForm((current) => ({ ...current, authError: message }))
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-form-column">
      <section
        className="login-form-panel !flex !flex-col !justify-between transition-all duration-300 ease-in-out"
        aria-labelledby="login-title"
      >
        <div className="login-form-content">
          <img className="login-upgrate-logo" src="/logo.png" alt="Upgrate" />
          <div className="auth-screen__eyebrow">Welcome back</div>
          <h2 id="login-title" className="auth-screen__title">
            Sign in to your account
          </h2>
          <p className="auth-screen__description">
            {otpSent
              ? `Enter the one-time password sent to your ${loginMode === 'email' ? 'work email' : 'mobile number'}.`
              : 'Sign in securely with a one-time password.'}
          </p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            <div className="login-field">
              <div className="login-field-heading">
                <label htmlFor="login-identifier">Email or mobile number</label>
                {otpSent && (
                  <button type="button" className="login-change-email" onClick={changeCredentials}>
                    Change
                  </button>
                )}
              </div>
              <div
                className={`login-input-wrap ${loginMode === 'phone' ? 'login-input-wrap--phone' : ''} ${form.identifierError ? 'has-error' : ''}`}
              >
                {loginMode === 'email' ? (
                  <Mail size={17} aria-hidden="true" />
                ) : (
                  <CountryDialPicker value={dialCountry} onChange={selectDialCountry} disabled={otpSent} />
                )}
                {loginMode === 'phone' && !hasInternationalPrefix(displayedPhone) && (
                  <span className="login-country-code" aria-hidden="true">
                    +{dialCountry.dialCode}
                  </span>
                )}
                <input
                  id="login-identifier"
                  ref={phoneInputRef}
                  type={loginMode === 'email' ? 'email' : 'tel'}
                  inputMode={loginMode === 'phone' ? 'tel' : undefined}
                  autoComplete={loginMode === 'email' ? 'email' : 'tel'}
                  placeholder={
                    loginMode === 'email' ? 'you@company.com or mobile number' : '98765 43210'
                  }
                  value={loginMode === 'email' ? form.email : displayedPhone}
                  onChange={(event) => {
                    const value = event.target.value
                    const nextMode = detectLoginMode(value)
                    let stored = value
                    if (nextMode === 'phone') {
                      if (hasInternationalPrefix(value)) {
                        // A typed +code / 00code picks the country; keep the raw entry.
                        const typedCountry = detectDialCountry(value)
                        if (typedCountry) {
                          dialCountryDetected.current = true
                          setDialCountry(typedCountry)
                        }
                      } else {
                        // No + / 00: a number longer than an Indian mobile ("966570490448",
                        // "447911123456") starts with its country code, so pick that flag.
                        // A country the user chose in the picker is never overridden.
                        const typedCountry = dialCountry === INDIA ? detectDialCountryFromDigits(value) : null
                        const digits = value.replace(/\D/g, '')
                        if (typedCountry === INDIA) {
                          stored = digits.slice(INDIA.dialCode.length)
                        } else if (typedCountry) {
                          dialCountryDetected.current = true
                          setDialCountry(typedCountry)
                          stored = `+${digits}`
                        } else {
                          stored = composePhone(value, dialCountry)
                        }
                      }
                    }
                    if (!value.trim() && dialCountryDetected.current) {
                      dialCountryDetected.current = false
                      setDialCountry(INDIA)
                    }
                    setLoginMode(nextMode)
                    setForm((current) => ({
                      ...current,
                      [nextMode]: stored,
                      identifierError: '',
                      authError: '',
                    }))
                    if (nextMode === 'phone') {
                      requestAnimationFrame(() => movePhoneCursorToEnd())
                    }
                  }}
                  onFocus={movePhoneCursorToEnd}
                  onClick={movePhoneCursorToEnd}
                  onKeyUp={movePhoneCursorToEnd}
                  disabled={otpSent}
                  aria-invalid={Boolean(form.identifierError)}
                  aria-describedby={form.identifierError ? 'login-identifier-error' : undefined}
                />
              </div>
              {form.identifierError && (
                <span id="login-identifier-error" className="field-error" role="alert">
                  {form.identifierError}
                </span>
              )}
            </div>

            {otpStatus && (
              <p className="login-otp-status" role="status">
                {otpStatus}
              </p>
            )}
            {otpSent && devOtp && (
              <div className="login-demo-otp-toast" role="status">
                <span>Template OTP</span>
                <strong>{devOtp}</strong>
                <small>Login ke liye neeche yahi code enter karein.</small>
              </div>
            )}

            {otpSent && (
              <div className="login-field login-otp-field">
                {loginMode === 'phone' && (
                  <div className="login-phone-verify-heading">
                    <h3>Verify One-Time Password</h3>
                    <p>
                      Enter the 4-digit code sent by{' '}
                      {otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to {form.phone}.
                    </p>
                  </div>
                )}
                <div className="login-field-heading">
                  <label htmlFor="login-otp">Enter OTP (4 Digit)</label>
                  <button
                    className="login-resend-otp"
                    type="button"
                    onClick={() => void resendOtp()}
                    disabled={resendCountdown > 0 || isResending || isSubmitting}
                  >
                    {resendCountdown > 0
                      ? `Resend OTP in 00:${String(resendCountdown).padStart(2, '0')}`
                      : 'Resend OTP'}
                  </button>
                </div>
                <input
                  id="login-otp"
                  type="text"
                  value={form.otp}
                  readOnly
                  aria-label="Enter OTP (4 Digit)"
                  className="login-otp-hidden-input"
                  tabIndex={-1}
                />
                <div className="login-otp-group" aria-label="OTP entry boxes">
                  {Array.from({ length: 4 }, (_, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpInputRefs.current[index] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={form.otp[index] ?? ''}
                      maxLength={1}
                      autoFocus={otpSent && index === 0}
                      onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      onPaste={handleOtpPaste}
                      aria-label={`OTP digit ${index + 1}`}
                      aria-describedby="login-otp-hint"
                      className="login-otp-digit"
                      onFocus={(event) => event.target.select()}
                    />
                  ))}
                </div>
                {form.authError ? (
                  <span id="login-otp-hint" className="login-otp-error" role="alert">
                    <ShieldCheck size={14} aria-hidden="true" />
                    {form.authError}
                  </span>
                ) : (
                  <span id="login-otp-hint" className="login-otp-hint">
                    {loginMode === 'email'
                      ? 'Enter the 4-digit code from your work email.'
                      : `Enter the 4-digit code sent by ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`}
                  </span>
                )}
              </div>
            )}

            {otpSent && (
              <div className="login-consent-block">
                <p className="login-consent">
                  By signing up, you agree to our <Link to="/terms-of-use">Terms of Use</Link> and{' '}
                  <Link to="/privacy-policy">Privacy Policy</Link>.
                </p>
              </div>
            )}

            {form.authError && !otpSent && (
              <p className="login-error" role="alert">
                <ShieldCheck size={16} />
                {form.authError}
              </p>
            )}
            {!otpSent && loginMode === 'phone' ? (
              form.phone.trim() ? (
                <div className="login-phone-delivery">
                  <div className="login-phone-delivery__buttons">
                    <button
                      type="button"
                      className="button login-phone-delivery__button"
                      onClick={() => void sendOtp('sms')}
                      disabled={!normalizePhoneNumber(form.phone) || isSubmitting || isResending}
                    >
                      {sendingChannel === 'sms' ? (
                        <>
                          <span className="login-spinner" /> Sending OTP…
                        </>
                      ) : (
                        'Send OTP via SMS'
                      )}
                    </button>
                    <button
                      type="button"
                      className="button button--primary login-phone-delivery__button"
                      onClick={() => void sendOtp('whatsapp')}
                      disabled={!normalizePhoneNumber(form.phone) || isSubmitting || isResending}
                    >
                      {sendingChannel === 'whatsapp' ? (
                        <>
                          <span className="login-spinner" /> Sending OTP…
                        </>
                      ) : (
                        'Send OTP via WhatsApp'
                      )}
                    </button>
                  </div>
                </div>
              ) : null
            ) : (
              <button
                type="submit"
                className="button button--primary login-submit"
                disabled={otpSent ? isSubmitting || isResending : isSubmitting || isResending}
              >
                {isResending ? (
                  <>
                    <span className="login-spinner" /> Sending OTP…
                  </>
                ) : isSubmitting ? (
                  <>
                    <span className="login-spinner" /> {otpSent ? 'Verifying…' : 'Sending OTP…'}
                  </>
                ) : (
                  <>
                    {otpSent
                      ? loginMode === 'phone'
                        ? 'Verify & Continue'
                        : 'Verify OTP & Login'
                      : 'Send OTP'}{' '}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </form>

          <div className="login-security-note">
            <ShieldCheck size={14} /> Your account details are handled securely.
          </div>
          <LoginFooter />
        </div>
      </section>
    </div>
  )
}
