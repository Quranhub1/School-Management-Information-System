import { useMemo } from 'react'
import type { ChartData, ChartOptions } from 'chart.js'
import { ChartCanvas } from './ChartCanvas'
import './charts.css'

export type BarChartDataset = { label: string; data: number[]; color?: string }
export type BarChartProps = {
  labels: string[]
  datasets: BarChartDataset[]
  ariaLabel: string
  valueFormatter?: (value: number) => string
  horizontal?: boolean
  maxValue?: number
  className?: string
}

const defaultFormatter = (value: number) => new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(value)
const defaultPalette = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#e11d48']

/** Shared bar-chart presentation for finance, academic, HR and operational comparisons. */
export function BarChart({ labels, datasets, ariaLabel, valueFormatter = defaultFormatter, horizontal = false, maxValue, className }: BarChartProps) {
  const data = useMemo<ChartData<'bar', number[], string>>(() => ({
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data.map(value => Number.isFinite(value) ? value : 0),
      backgroundColor: dataset.color ?? defaultPalette[index % defaultPalette.length],
      borderRadius: 4,
      borderSkipped: false,
      maxBarThickness: 34,
    })),
  }), [labels, datasets])

  const options = useMemo<ChartOptions<'bar'>>(() => ({
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: datasets.length > 1, position: 'bottom' },
      tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${valueFormatter(Number(horizontal ? context.parsed.x : context.parsed.y) || 0)}` } },
    },
    scales: horizontal ? {
      x: { beginAtZero: true, ...(maxValue === undefined ? {} : { max: maxValue }), grid: { color: 'rgba(148,163,184,.16)' }, ticks: { callback: value => valueFormatter(Number(value)) } },
      y: { grid: { display: false } },
    } : {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ...(maxValue === undefined ? {} : { max: maxValue }), grid: { color: 'rgba(148,163,184,.16)' }, ticks: { callback: value => valueFormatter(Number(value)) } },
    },
  }), [datasets.length, horizontal, maxValue, valueFormatter])

  const hasValues = labels.length > 0 && datasets.some(dataset => dataset.data.length > 0)
  return <div className={className ? `smis-bar-chart ${className}` : 'smis-bar-chart'}>
    {hasValues ? <ChartCanvas type="bar" data={data} options={options} ariaLabel={ariaLabel} /> : <div className="smis-chart-empty">No chart data available</div>}
  </div>
}
