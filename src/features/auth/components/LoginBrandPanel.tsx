import { Activity, CalendarCheck2, CircleCheck, UsersRound, WalletCards } from 'lucide-react'

const features = [
  { label: 'Employee management', Icon: UsersRound },
  { label: 'Attendance & leave', Icon: CalendarCheck2 },
  { label: 'Payments & reimbursements', Icon: WalletCards },
  { label: 'Payroll management', Icon: WalletCards },
  { label: 'Workforce insights', Icon: Activity },
]

export function LoginBrandPanel() {
  return (
    <section className="login-brand-panel" aria-label="About HRM">
      <div className="login-brand-glow login-brand-glow--one" />
      <div className="login-brand-glow login-brand-glow--two" />
      <div className="login-brand-content">
        <div className="login-brand-copy">
          <span className="login-brand-kicker"><CircleCheck size={14} /> People operations, made clear</span>
          <h1>Manage your workforce with confidence.</h1>
          <p>Streamline employees, attendance, leave, payroll and day-to-day HR operations from one powerful platform.</p>
        </div>

        <ul className="login-feature-list">
          {features.map(({ label, Icon }) => (
            <li key={label}><span><Icon size={16} /></span>{label}</li>
          ))}
        </ul>

        <div className="login-insight-card" aria-hidden="true">
          <div className="login-insight-heading"><span className="login-insight-icon"><UsersRound size={16} /></span><span>Workforce at a glance<small>Team overview</small></span><span className="login-insight-dots">•••</span></div>
          <div className="login-insight-metric">248 <span>active employees</span></div>
          <div className="login-insight-bars"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="login-insight-foot"><span><i /> Healthy team growth</span><b>+8.4%</b></div>
        </div>
      </div>
      <div className="login-brand-footer">A simpler way to support your people.</div>
    </section>
  )
}
