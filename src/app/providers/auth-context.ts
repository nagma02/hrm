import { createContext } from 'react'
import type { AuthSession, Permission, User } from '@/types/auth'

export type AuthContextValue = {
  portal: 'admin' | 'employee'
  setPortal: (portal: 'admin' | 'employee') => void
  session: AuthSession | null
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  acceptSession: (session: AuthSession) => void
  updateUser: (updates: Partial<User>) => void
  signOut: () => void
  hasPermission: (permission: Permission) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
