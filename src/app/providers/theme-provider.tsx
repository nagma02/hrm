import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { APP_STORAGE_KEYS } from '@/constants/app'

export type ThemePreference = 'light' | 'dark' | 'system'
type ThemeContextValue = { theme: ThemePreference; setTheme: (theme: ThemePreference) => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: ThemePreference) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('light', !dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

function readTheme(): ThemePreference {
  const saved = localStorage.getItem(APP_STORAGE_KEYS.theme)
  return saved === 'dark' || saved === 'system' ? saved : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const initial = readTheme()
    applyTheme(initial)
    return initial
  })

  const setTheme = useCallback((next: ThemePreference) => {
    localStorage.setItem(APP_STORAGE_KEYS.theme, next)
    applyTheme(next)
    setThemeState(next)
  }, [])

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
