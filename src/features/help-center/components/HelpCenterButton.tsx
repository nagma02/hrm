import { useEffect, useMemo, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { isEmployeePortalPath } from '@/app/router/portal-route'
import { HelpCenterModal } from '@/components/HelpCenterModal'
import { helpTopics } from '../data/helpTopics'
import type { HelpTopic } from '../types'

export function HelpCenterButton() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<HelpTopic | null>(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const close = () => { setOpen(false); setSelected(null) }
  useEffect(() => {
    const openHelpCenter = () => { setSelected(null); setQuery(''); setOpen(true) }
    window.addEventListener('hrm:open-help-center', openHelpCenter)
    return () => window.removeEventListener('hrm:open-help-center', openHelpCenter)
  }, [])
  const isEmployeePortal = isEmployeePortalPath(location.pathname)
  const topics = useMemo(() => {
    const roleTopics = isEmployeePortal
      ? helpTopics.filter((topic) => /leave|attendance|profile|payroll|payslip|policy|hr|contact/i.test(topic.title) || /leave|attendance|profile|payroll|payslip|policy|hr/i.test(topic.description))
      : helpTopics.filter((topic) => /employee|attendance|leave|shift|holiday|announcement|manage/i.test(topic.title) || /employee|attendance|leave|shift|holiday|announcement|manage/i.test(topic.description))

    return roleTopics.filter((topic) => `${topic.title} ${topic.description}`.toLowerCase().includes(query.toLowerCase()))
  }, [isEmployeePortal, query])

  return (
    <div className="help-center-wrap">
      <button
        type="button"
        className="icon-button"
        aria-label="Open Help Center"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <CircleHelp size={18} />
        <span className="sr-only">Help</span>
      </button>

      <HelpCenterModal
        open={open}
        onClose={close}
        selected={selected}
        onBack={() => setSelected(null)}
        query={query}
        onQueryChange={setQuery}
        results={topics}
        onSelectTopic={setSelected}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  )
}
