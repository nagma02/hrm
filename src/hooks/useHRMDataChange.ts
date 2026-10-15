import { useEffect, useState } from 'react'

/** Re-render a view when one of the browser-backed HR stores changes. */
export function useHRMDataChange() {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const update = () => setRevision((revision) => revision + 1)
    const storageUpdate = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('hrm-')) update()
    }
    window.addEventListener('hrm:data-change', update)
    window.addEventListener('storage', storageUpdate)
    return () => {
      window.removeEventListener('hrm:data-change', update)
      window.removeEventListener('storage', storageUpdate)
    }
  }, [])
  return revision
}
