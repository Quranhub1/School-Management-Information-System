import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
export function Dialog({ open, onOpenChange, children }: { open:boolean; onOpenChange:(open:boolean)=>void; children:ReactNode }) {
  useEffect(()=>{ if(!open) return; const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onOpenChange(false)}; document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey)},[open,onOpenChange])
  if(!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center p-4"><div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={()=>onOpenChange(false)} />{children}</div>
}
export function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div role="dialog" aria-modal="true" className={cn('relative z-10 w-full max-w-lg rounded-2xl border border-white/20 bg-white p-6 shadow-2xl shadow-slate-950/15',className)} {...props} /> }
export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('mb-5 grid gap-1.5',className)} {...props} /> }
export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn('text-lg font-semibold tracking-tight text-slate-950',className)} {...props} /> }
export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn('text-sm leading-6 text-slate-500',className)} {...props} /> }
