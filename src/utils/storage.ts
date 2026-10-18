export function readStorageValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    return rawValue ? (JSON.parse(rawValue) as T) : fallback
  } catch {
    return fallback
  }
}

/** Returns false when the value could not be persisted (quota exceeded or storage blocked). */
export function writeStorageValue<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorageValue(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage unavailable: nothing persisted to remove.
  }
}

/** Minimal in-memory Storage used when the browser blocks Web Storage. */
class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(String(key)) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(String(key)) }
  setItem(key: string, value: string) { this.values.set(String(key), String(value)) }
}

function storageWorks(name: 'localStorage' | 'sessionStorage') {
  try {
    const storage = window[name]
    const probe = '__hrm_storage_probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Private windows, blocked site data and some embedded browsers throw on any Web
 * Storage access. The app persists its demo data locally, so swap in an in-memory
 * store for that session instead of crashing to a blank screen.
 */
export function installStorageFallback() {
  if (typeof window === 'undefined') return
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    if (storageWorks(name)) continue
    try {
      Object.defineProperty(window, name, { configurable: true, value: new MemoryStorage() })
    } catch {
      // Property not redefinable in this environment; leave it as is.
    }
  }
}
