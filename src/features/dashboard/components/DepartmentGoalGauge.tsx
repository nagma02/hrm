import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'
import { departmentGoalProgress } from '../data/dashboardData'

export default function DepartmentGoalGauge() {
  return <section className="card dashboard-visual-card department-goal-card" aria-labelledby="department-goal-title">
    <div className="chart-heading"><div><span className="eyebrow">WORKFORCE</span><h3 className="section-title" id="department-goal-title">Department goals</h3><p>Monthly completion overview</p></div></div>
    <div className="goal-gauge"><ResponsiveContainer width="100%" height="100%"><RadialBarChart data={[{ name: 'Completed', value: departmentGoalProgress.percent, fill: 'var(--chart-present)' }]} startAngle={180} endAngle={0} innerRadius="72%" outerRadius="100%" barSize={18}><RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'var(--chart-grid)' }} /></RadialBarChart></ResponsiveContainer><div className="goal-gauge-label"><strong>{departmentGoalProgress.percent}%</strong><span>complete</span></div></div>
    <small className="dashboard-data-note">{departmentGoalProgress.period}; illustrative demo target.</small>
  </section>
}
