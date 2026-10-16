import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ModuleRow } from '@/features/shared/data/moduleData'

export function PunchLocationCell({ location }: { location?: ModuleRow['punchLocation'] }) {
  if (!location) return <>—</>
  return (
    <a
      href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
      target="_blank"
      rel="noreferrer"
      className="attendance-view-link"
    >
      View
    </a>
  )
}

export function PunchPhotoCell({ photo, name }: { photo?: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false)
  if (!photo) return <>—</>
  return (
    <>
      <button type="button" className="attendance-view-link" onClick={() => setIsOpen(true)} aria-label={`View punch photo for ${name}`}>
        View
      </button>
      {isOpen && createPortal(
        <div className="modal-backdrop attendance-photo-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <section className="attendance-photo-dialog" role="dialog" aria-modal="true" aria-label={`Punch-in photo for ${name}`}>
            <button type="button" className="modal-close" aria-label="Close photo" onClick={() => setIsOpen(false)}><X size={18} /></button>
            <h2>{name} · Punch-in photo</h2>
            <img src={photo} alt={`Punch-in verification for ${name}`} />
          </section>
        </div>,
        document.body,
      )}
    </>
  )
}
