import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
export function Sheet({ open, onOpenChange, children }: { open:boolean; onOpenChange:(open:boolean)=>void; children:ReactNode }) { if(!open)return null; return <div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={()=>onOpenChange(false)}/>{children}</div> }
export function SheetContent({ side='right', className, ...props }: React.HTMLAttributes<HTMLDivElement> & { side?:'left'|'right' }) { return <div role="dialog" aria-modal="true" className={cn('absolute top-0 h-full w-[min(88vw,380px)] bg-white p-6 shadow-2xl',side==='left'?'left-0':'right-0',className)} {...props} /> }
