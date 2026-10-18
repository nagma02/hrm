import { AlertTriangle, RotateCcw } from 'lucide-react'

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon" aria-hidden="true"><AlertTriangle size={20} /></span>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
      {onRetry ? (
        <button type="button" className="button primary state__action" onClick={onRetry}>
          <RotateCcw size={15} aria-hidden="true" /> Try again
        </button>
      ) : null}
    </div>
  )
}
