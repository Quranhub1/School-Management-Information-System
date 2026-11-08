import type { ChartData, ChartOptions } from 'chart.js'
import { ChartCanvas } from './ChartCanvas'
import './charts.css'

export type DoughnutSegment = { label: string; value: number; color: string; displayValue?: string }
export type DoughnutChartProps = {
  title: string
  description?: string
  segments: DoughnutSegment[]
  centerValue: string
  centerCaption: string
}

const numberFormat = new Intl.NumberFormat('en-UG')

export function DoughnutChart({ title, description, segments, centerValue, centerCaption }: DoughnutChartProps) {
  const safeSegments = segments.map(segment => ({ ...segment, value: Math.max(0, Number.isFinite(segment.value) ? segment.value : 0) }))
  const data: ChartData<'doughnut', number[], string> = {
    labels: safeSegments.map(segment => segment.label),
    datasets: [{
      data: safeSegments.map(segment => segment.value),
      backgroundColor: safeSegments.map(segment => segment.color),
      borderWidth: 0,
      hoverOffset: 5,
      spacing: 2,
    }],
  }
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { duration: 350 },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, callbacks: { label: context => ` ${context.label}: ${numberFormat.format(Number(context.parsed) || 0)}` } },
    },
  }
  const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0)

  return <article className="admin-chart-card smis-chart-card">
    <div className="admin-chart-heading"><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div>
    <div className="admin-chart-body smis-doughnut-body">
      <div className="smis-doughnut-plot">
        <ChartCanvas type="doughnut" data={data} options={options} ariaLabel={`${title}: ${safeSegments.map(segment => `${segment.label} ${segment.value}`).join(', ')}`} />
        <div className="smis-doughnut-center"><strong>{centerValue}</strong><span>{centerCaption}</span></div>
      </div>
      <ul className="admin-chart-legend">
        {safeSegments.map(segment => <li key={segment.label}>
          <span className="admin-legend-label"><i style={{ background: segment.color }} />{segment.label}</span>
          <strong>{segment.displayValue ?? numberFormat.format(segment.value)}</strong>
        </li>)}
        {total === 0 && <li className="admin-chart-empty">No records to display</li>}
      </ul>
    </div>
  </article>
}
