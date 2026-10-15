import React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

type Props = {
  icon: React.ReactNode
  label: string
  value: number | string
  hint?: string
  change?: number
  sparkline?: number[]
  onClick?: () => void
}

export default function StatsCard({ icon, label, value, hint, change, sparkline, onClick }: Props) {
  const positive = typeof change === 'number' && change >= 0
  const min = Math.min(...(sparkline ?? [0]))
  const max = Math.max(...(sparkline ?? [1]))
  const points = (sparkline ?? []).map((point, index) => `${(index / Math.max(1, (sparkline?.length ?? 1) - 1)) * 70},${25 - ((point - min) / Math.max(1, max - min)) * 20}`).join(' ')
  return (
    <div role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(event) => { if (onClick && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onClick() } }} className={`card stat-card${onClick ? ' stat-card--clickable' : ''}`}>
      <div className="stat-card__content">
        <div className="stat-card__copy">
          <div className="stat-card__label">{label}</div>
          <div className="stat-card__value">{value}</div>
          {hint ? <div className="stat-card__hint">{hint}</div> : null}
        </div>

        <div className="stat-card__side">
          {points && <svg className="stat-sparkline" viewBox="0 0 70 28" role="img" aria-label={`${label} recent trend`}><polyline points={points} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          <div className="stat-card__icon">
            {icon}
          </div>
          {typeof change === 'number' ? (
            <div className={`stat-card__change${positive ? ' is-positive' : ' is-negative'}`}>
              {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{Math.abs(change)}%</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
