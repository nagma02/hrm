import { ArrowRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/features/shared/PageHeader'

export default function LeaveHeader({ pending }: { pending: number }) {
  const navigate = useNavigate()

  return (
    <PageHeader
      eyebrow="People operations"
      title="Leave management"
      subtitle="Keep time-off requests organized and help your team plan ahead."
      actions={
        <>
          <button className="button" onClick={() => navigate('/app/leave/approvals')}>
            Review approvals{pending > 0 && <span className="page-hero__count">{pending}</span>}<ArrowRight size={15} />
          </button>
          <button className="button primary" onClick={() => navigate('/app/leave/apply')}><Plus size={16} /> Apply for leave</button>
        </>
      }
    />
  )
}
