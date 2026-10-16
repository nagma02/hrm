import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartPie } from 'lucide-react'
import type { ModuleRow } from '@/features/shared/data/moduleData'
import { designationCounts } from '@/features/shared/data/moduleData'

function employeeCount(row: ModuleRow) {
  return designationCounts[row.id] ?? Number(row.detail.match(/(\d+) employees?/)?.[1] ?? 0)
}

export default function DesignationDistribution({ rows }: { rows: ModuleRow[] }) {
  const data = rows
    .map((row) => ({ name: row.name, department: row.department, employees: employeeCount(row) }))
    .sort((a, b) => b.employees - a.employees)
  const colors = ['var(--chart-present)', 'var(--chart-leave)', 'var(--chart-late)', 'var(--chart-absent)', 'var(--chart-neutral)']
  const total = data.reduce((sum, row) => sum + row.employees, 0)

  return (
    <section
      className="designation-distribution-chart"
      aria-labelledby="designation-distribution-title"
    >
      <div className="designation-module-heading">
        <div>
          <span className="designation-section-kicker">WORKFORCE MIX</span>
          <h2 id="designation-distribution-title">Employees by designation</h2>
          <p>Headcount comparison across defined roles.</p>
        </div>
        <span className="designation-heading-icon">
          <ChartPie size={18} />
        </span>
      </div>
      {data.length ? (
        <div className="designation-donut-layout">
          <div className="designation-donut-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="employees"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={4}
                  cornerRadius={5}
                  stroke="#fffefa"
                  strokeWidth={3}
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #d9d8cc',
                    borderRadius: 9,
                    backgroundColor: '#fffefa',
                    boxShadow: '0 8px 22px rgb(53 55 47 / 10%)',
                  }}
                  formatter={(value) => [`${Number(value)} employees`, 'Headcount']}
                  labelFormatter={(label, payload) =>
                    payload[0]?.payload.department
                      ? `${label} · ${payload[0].payload.department}`
                      : label
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="designation-donut-center">
              <strong>{total}</strong>
              <span>employees</span>
            </div>
          </div>
          <div className="designation-donut-legend">
            {data.map((entry, index) => (
              <div key={entry.name}>
                <i style={{ backgroundColor: colors[index % colors.length] }} />
                <span>
                  <strong>{entry.name}</strong>
                  <small>{entry.department}</small>
                </span>
                <b>{entry.employees}</b>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="designation-distribution-empty">
          Create designations to visualize employee distribution across roles.
        </div>
      )}
      <div className="designation-chart-caption">
        <i /> Employee headcount by designation
      </div>
    </section>
  )
}
