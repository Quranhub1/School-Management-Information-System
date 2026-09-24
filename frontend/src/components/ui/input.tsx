import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export const Input=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(({className,type='text',...props},ref)=><input ref={ref} type={type} className={cn('flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',className)} {...props}/>)
Input.displayName='Input'
