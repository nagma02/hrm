import React from 'react'

export default function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const badgeLabel = subtitle ? 'Overview' : 'Details'

  return (
    <div className="page-header">
      <div>
        <div className="badge badge--info">{badgeLabel}</div>
        <h2 className="section-title">{title}</h2>
        {subtitle ? <div style={{ color: 'var(--color-muted)', marginTop: 6 }}>{subtitle}</div> : null}
      </div>

      <div>{actions}</div>
    </div>
  )
}
