import { MoreHorizontal } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export type ActionDropdownItem = {
  label: string
  icon?: ReactNode
  onClick?: () => void
  destructive?: boolean
  disabled?: boolean
}

export function ActionDropdown({
  actions,
  label = 'More actions',
}: {
  actions: ActionDropdownItem[]
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<CSSProperties>({})
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !menuContentRef.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!open || !buttonRef.current) return

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuHeight = menuContentRef.current?.offsetHeight ?? Math.min(actions.length * 38 + 14, 280)
      const openAbove = window.innerHeight - rect.bottom < menuHeight + 12 && rect.top > menuHeight + 12
      setMenuPosition({
        position: 'fixed',
        left: Math.max(8, Math.min(rect.right - 190, window.innerWidth - 198)),
        top: openAbove ? Math.max(8, rect.top - menuHeight - 8) : rect.bottom + 8,
        zIndex: 10000,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, actions.length])

  return (
    <div className="action-dropdown" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className="action-dropdown__button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal size={15} />
      </button>

      {open && createPortal(
        <div ref={menuContentRef} className="action-dropdown__menu" style={menuPosition} role="menu" aria-label={label}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              className={`action-dropdown__item ${action.destructive ? 'is-destructive' : ''}`}
              disabled={action.disabled}
              onClick={() => {
                action.onClick?.()
                setOpen(false)
              }}
            >
              {action.icon ? <span className="action-dropdown__icon">{action.icon}</span> : null}
              {action.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
