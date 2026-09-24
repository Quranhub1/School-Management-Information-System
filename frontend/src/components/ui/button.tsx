import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default'|'secondary'|'outline'|'ghost'|'destructive'; size?: 'default'|'sm'|'lg'|'icon' }
const variants={default:'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',secondary:'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',outline:'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',ghost:'text-slate-600 hover:bg-slate-100 hover:text-slate-950',destructive:'bg-red-600 text-white hover:bg-red-700 shadow-sm'}
const sizes={default:'h-10 px-4 py-2',sm:'h-9 rounded-lg px-3 text-sm',lg:'h-11 rounded-xl px-6',icon:'h-10 w-10'}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(({className,variant='default',size='default',type='button',...props},ref)=><button ref={ref} type={type} className={cn('inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',variants[variant],sizes[size],className)} {...props}/>)
Button.displayName='Button'
