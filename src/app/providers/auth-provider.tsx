import { useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext, AuthContextValue } from './auth-context'
import { clearAuthSession, fetchCurrentUser, getStoredAuthSession, logoutAuthSession, persistAuthSession } from '@/services/auth.service'
import { refreshAuthSession } from '@/services/api-client'
import { hasUserPermission, isAdminPortalUser } from '@/app/auth/access'
import { APP_STORAGE_KEYS } from '@/constants/app'
import type { ReactNode } from 'react'
import type { AuthSession, Permission, User } from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession())
  const [portal, setPortalState] = useState<'admin' | 'employee'>(() => {
    const canUseAdminPortal = isAdminPortalUser(session?.user)
    return canUseAdminPortal && window.localStorage.getItem(APP_STORAGE_KEYS.portal) === 'employee'
      ? 'employee'
      : canUseAdminPortal ? 'admin' : 'employee'
  })
  const sessionRef = useRef(session)
  const [isInitializing, setIsInitializing] = useState(() => Boolean(session?.accessToken))

  useEffect(() => { sessionRef.current = session }, [session])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession()
      setPortalState('employee')
      setSession(null)
      setIsInitializing(false)
    }
    const handleSessionStorage = (event: StorageEvent) => {
      if (event.key === APP_STORAGE_KEYS.authSession) {
        const storedSession = getStoredAuthSession()
        const canUseAdminPortal = isAdminPortalUser(storedSession?.user)
        setPortalState(canUseAdminPortal && window.localStorage.getItem(APP_STORAGE_KEYS.portal) === 'employee' ? 'employee' : canUseAdminPortal ? 'admin' : 'employee')
        setSession(storedSession)
        setIsInitializing(false)
      }
    }
    const handleSessionRefreshed = (event: Event) => {
      const refreshed = (event as CustomEvent<AuthSession>).detail
      if (refreshed) {
        setSession(refreshed)
        setIsInitializing(false)
      }
    }
    window.addEventListener('hrm:unauthorized', handleUnauthorized)
    window.addEventListener('storage', handleSessionStorage)
    window.addEventListener('hrm:session-refreshed', handleSessionRefreshed)
    return () => {
      window.removeEventListener('hrm:unauthorized', handleUnauthorized)
      window.removeEventListener('storage', handleSessionStorage)
      window.removeEventListener('hrm:session-refreshed', handleSessionRefreshed)
    }
  }, [])

  useEffect(() => {
    const accessToken = session?.accessToken
    if (!accessToken) return
    let active = true
    fetchCurrentUser(sessionRef.current?.user).then((currentUser) => {
      if (!active) return
      setSession((current) => {
        const next = current
          ? { ...current, user: { ...current.user, ...currentUser } }
          : { user: currentUser }
        persistAuthSession(next, Boolean(window.localStorage.getItem(APP_STORAGE_KEYS.authSession)))
        return next
      })
    }).catch(() => {
      // The API interceptor handles invalid sessions; transient failures keep the cached profile available.
    }).finally(() => {
      if (active) setIsInitializing(false)
    })
    return () => { active = false }
  }, [session?.accessToken])

  useEffect(() => {
    if (!session?.expiresAt) return
    const expiresAt = new Date(session.expiresAt).getTime()
    if (!Number.isFinite(expiresAt)) return
    const refreshIn = session.refreshToken ? Math.max(1000, expiresAt - Date.now() - 60_000) : Math.max(0, expiresAt - Date.now())
    const expireSession = () => {
      clearAuthSession()
      window.localStorage.removeItem(APP_STORAGE_KEYS.portal)
      setPortalState('employee')
      setSession(null)
      setIsInitializing(false)
    }
    const timer = window.setTimeout(() => {
      if (!session.refreshToken) {
        expireSession()
        return
      }
      void refreshAuthSession().catch(() => {
        expireSession()
      })
    }, refreshIn)
    return () => window.clearTimeout(timer)
  }, [session])

  const value: AuthContextValue = useMemo(() => {
    const user: User | null = session?.user ?? null

    return {
      portal,
      setPortal: (nextPortal) => {
        if (nextPortal === 'admin' && !isAdminPortalUser(user)) return
        window.localStorage.setItem(APP_STORAGE_KEYS.portal, nextPortal)
        setPortalState(nextPortal)
      },
      session,
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      acceptSession: (nextSession) => {
        const nextPortal = isAdminPortalUser(nextSession.user) ? 'admin' : 'employee'
        window.localStorage.setItem(APP_STORAGE_KEYS.portal, nextPortal)
        setPortalState(nextPortal)
        persistAuthSession(nextSession, true)
        setSession(nextSession)
        setIsInitializing(false)
      },
      updateUser: (updates) => {
        setSession((current) => {
          if (!current) return current
          const next = { ...current, user: { ...current.user, ...updates } }
          persistAuthSession(next, Boolean(window.localStorage.getItem(APP_STORAGE_KEYS.authSession)))
          return next
        })
      },
      signOut: () => {
        void logoutAuthSession(session).catch(() => undefined)
        clearAuthSession()
        window.localStorage.removeItem(APP_STORAGE_KEYS.portal)
        setPortalState('employee')
        setSession(null)
        setIsInitializing(false)
      },
      hasPermission: (permission: Permission) => hasUserPermission(user, permission),
    }
  }, [session, isInitializing, portal])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
