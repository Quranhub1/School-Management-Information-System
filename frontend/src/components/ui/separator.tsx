import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
export function Separator({ className, orientation='horizontal', ...props }: HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) {
  return <div role="separator" aria-orientation={orientation} className={cn('shrink-0 bg-slate-200', orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full', className)} {...props} />
}
