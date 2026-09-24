import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Progress({ value=0, className, ...props }: HTMLAttributes<HTMLDivElement> & { value?: number }) { const v=Math.min(100,Math.max(0,value)); return <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100',className)} {...props}><div className="h-full rounded-full bg-blue-600 transition-[width] duration-200" style={{width:v+'%'}} /></div> }
