import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartTooltip from './ChartTooltip'
import { useEmployees } from '@/features/employees/hooks/useEmployees'

export default function EmployeeGrowth() {
  const employees = useEmployees()
  const today = new Date()
  const employeeGrowth = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1)
    const through = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
    const throughDate = `${through.getFullYear()}-${String(through.getMonth() + 1).padStart(2, '0')}-${String(through.getDate()).padStart(2, '0')}`
    return {
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      employees: employees.filter((employee) => employee.status.toLowerCase() !== 'inactive' && employee.joinDate <= throughDate).length,
    }
  })
  const latestHeadcount = employeeGrowth.at(-1)?.employees ?? 0
  const minimum = Math.min(0, ...employeeGrowth.map((item) => item.employees))
  const maximum = Math.max(1, ...employeeGrowth.map((item) => item.employees))
  return (
    <section className="card growth-card">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">WORKFORCE</span>
          <h3 className="section-title">Employee growth</h3>
          <p>Headcount over the last six months</p>
        </div>
        <span className="growth-total">{latestHeadcount} <small>employees</small></span>
      </div>
      <div className="growth-chart" role="group" aria-label={`Employee headcount increased from ${employeeGrowth[0]?.employees ?? 0} in ${employeeGrowth[0]?.month ?? 'the first month'} to ${latestHeadcount} in ${employeeGrowth.at(-1)?.month ?? 'the latest month'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={employeeGrowth} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
            <defs><linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-present)" stopOpacity={0.2}/><stop offset="72%" stopColor="var(--chart-present)" stopOpacity={0.055}/><stop offset="100%" stopColor="var(--chart-present)" stopOpacity={0.005}/></linearGradient></defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 5" vertical={false}/>
            <XAxis dataKey="month" tickFormatter={(month: string) => month.slice(0, 3)} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }} dy={8}/>
            <YAxis domain={[minimum, maximum]} tickFormatter={(value: number) => value.toLocaleString()} axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-label)', fontSize: 12 }}/>
            <Tooltip content={ChartTooltip} cursor={{ stroke: '#d8e4dc', strokeDasharray: '4 4' }} animationDuration={180}/>
            <Area type="monotone" dataKey="employees" name="Employees" stroke="var(--chart-present)" strokeWidth={2.5} fill="url(#growthFill)" dot={{ r: 3.5, fill: 'var(--chart-present)', stroke: '#fffefa', strokeWidth: 1.5 }} activeDot={{ r: 5.5, fill: 'var(--chart-present)', stroke: '#fffefa', strokeWidth: 2 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
