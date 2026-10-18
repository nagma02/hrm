import React from 'react'

type PageHeaderProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  /** Small label above the title; defaults to the current section (e.g. "Payroll"). */
  eyebrow?: React.ReactNode
  /** Extra content under the subtitle, e.g. quick facts or tabs. */
  children?: React.ReactNode
  className?: string
}

const sectionName = (pathname: string) => {
  const section = pathname.split('/').filter(Boolean)[1] ?? 'dashboard'
  return section.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/**
 * Page hero banner shared by every module: dark-green gradient surface with the
 * login panel's ring motif, an eyebrow, the page title, and the page's actions.
 */
export default function PageHeader({ title, subtitle, actions, eyebrow, children, className }: PageHeaderProps) {
  // Pages remount on navigation, so the current URL is enough here (and keeps the header usable outside a Router).
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname

  return (
    <section className={`page-hero${className ? ` ${className}` : ''}`}>
      <div className="page-hero__copy">
        <span className="page-hero__eyebrow">{eyebrow ?? sectionName(pathname)}</span>
        <h1 className="page-hero__title">{title}</h1>
        {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
        {children}
      </div>

      {actions ? <div className="page-hero__actions">{actions}</div> : null}
    </section>
  )
}
