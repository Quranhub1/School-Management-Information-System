import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Select({className,...props}: SelectHTMLAttributes<HTMLSelectElement>){return <select className={cn('flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors duration-150 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50',className)} {...props}/>} 
