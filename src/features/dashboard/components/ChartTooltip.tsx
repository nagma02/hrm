import type { TooltipContentProps } from 'recharts'

type ChartTooltipProps = TooltipContentProps

export default function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const entries = payload.filter((entry) => entry.value !== undefined && entry.value !== null)

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{label}</div>
      <div className="chart-tooltip__items">
        {entries.map((entry, index) => (
          <div className="chart-tooltip__item" key={`${entry.dataKey ?? entry.name}-${index}`}>
            <span className="chart-tooltip__series"><i style={{ backgroundColor: entry.color ?? 'var(--chart-present)' }} />{entry.name}</span>
            <strong>{Number(entry.value).toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
