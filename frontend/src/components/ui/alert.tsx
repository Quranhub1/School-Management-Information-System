import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div role="alert" className={cn('relative w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm', className)} {...props} /> }
export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} /> }
export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('text-sm leading-6 text-slate-600', className)} {...props} /> }
