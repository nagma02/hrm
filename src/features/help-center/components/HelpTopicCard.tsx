import type { HelpTopic } from '../types'

export function HelpTopicCard({ topic, onSelect }: { topic: HelpTopic; onSelect: (topic: HelpTopic) => void }) {
  return (
    <button
      type="button"
      className="help-topic-card w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:bg-slate-50"
      onClick={() => onSelect(topic)}
    >
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-medium text-slate-700">{topic.title}</strong>
        <small className="mt-1 block text-xs leading-5 text-slate-500">{topic.description}</small>
      </span>
      <span aria-hidden="true" className="text-lg text-slate-400">›</span>
    </button>
  )
}
