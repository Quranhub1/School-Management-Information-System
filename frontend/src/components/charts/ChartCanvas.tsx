import { useEffect, useRef } from 'react'
import { Chart as ChartJS, registerables, type ChartConfiguration, type ChartData, type ChartOptions, type ChartType } from 'chart.js'

ChartJS.register(...registerables)

export type ChartCanvasProps<TType extends ChartType = ChartType> = {
  type: TType
  data: ChartData<TType, number[], string>
  options?: ChartOptions<TType>
  ariaLabel: string
  className?: string
}

/** Shared Chart.js renderer. Chart.js is bundled with the application; no CDN is used. */
export function ChartCanvas<TType extends ChartType>({ type, data, options, ariaLabel, className }: ChartCanvasProps<TType>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    chartRef.current?.destroy()
    chartRef.current = new ChartJS(canvas, { type, data, options } as ChartConfiguration)
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [type, data, options])

  return <div className={className ? `smis-chart-canvas ${className}` : 'smis-chart-canvas'}>
    <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
  </div>
}
