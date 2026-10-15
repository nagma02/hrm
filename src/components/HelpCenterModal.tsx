import { ArrowLeft, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import ReactDOM from 'react-dom'

import { HelpTopicCard } from '@/features/help-center/components/HelpTopicCard'
import type { HelpTopic } from '@/features/help-center/types'

export function HelpCenterModal({
  open,
  onClose,
  selected,
  onBack,
  query,
  onQueryChange,
  results,
  onSelectTopic,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  selected: HelpTopic | null
  onBack: () => void
  query: string
  onQueryChange: (value: string) => void
  results: HelpTopic[]
  onSelectTopic: (topic: HelpTopic) => void
  onNavigate: (path: string) => void
}) {
  useEffect(() => {
    if (!open) return

    const handle = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handle)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handle)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const content: ReactNode = (
    <div className="fixed inset-0 z-[99999] pointer-events-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <aside
        className="fixed right-4 top-4 bottom-4 z-[100000] flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 bg-white p-5 text-slate-800">
          <div className="flex min-w-0 items-center gap-3">
            {selected ? (
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Back to Help Center topics"
                onClick={onBack}
              >
                <ArrowLeft size={16} />
              </button>
            ) : null}
            <div className="min-w-0">
              <h2 id="help-center-title" className="truncate text-base font-semibold text-slate-800">
                {selected?.title ?? 'Help Center'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selected ? 'Quick guidance for this task.' : 'Find quick answers to common HR tasks.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Help Center"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-white p-6">
          {selected ? (
            <div className="space-y-4 bg-white text-slate-600">
              <p className="text-sm leading-6 text-slate-600">{selected.answer}</p>
              {selected.action ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  onClick={() => {
                    onNavigate(selected.action!.path)
                    onClose()
                  }}
                >
                  {selected.action.label}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 bg-white">
              <label className="relative block">
                <span className="sr-only">Search help topics</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Search help topics"
                />
              </label>

              <div className="space-y-1 bg-white">
                {results.length ? (
                  results.map((topic) => (
                    <div key={topic.title} className="bg-white">
                      <HelpTopicCard topic={topic} onSelect={onSelectTopic} />
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">No matching topics.</p>
                )}
              </div>
            </div>
          )}

          <nav className="mt-6 flex items-center justify-center gap-4 border-t border-slate-100 bg-white pt-4 text-xs text-slate-500" aria-label="Legal policies">
            <a className="transition hover:text-slate-700" href="https://upgradeinfotech.in/terms-of-use" target="_blank" rel="noreferrer">Terms &amp; Conditions</a>
            <a className="transition hover:text-slate-700" href="https://upgradeinfotech.in/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
          </nav>
        </div>
      </aside>
    </div>
  )

  return ReactDOM.createPortal(content, document.body)
}
