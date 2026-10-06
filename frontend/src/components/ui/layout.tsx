import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Layout({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('min-h-[calc(100vh-4rem)] flex flex-col', className)} {...props}>
    {children}
  </div>
}

export function LayoutHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex items-center justify-between gap-4 px-6 py-4 border-b border-muted', className)} {...props}>
    {children}
  </div>
}

export function LayoutMain({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex-1 overflow-y-auto p-6', className)} {...props}>
    {children}
  </div>
}

export function LayoutFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex items-center justify-between gap-4 px-6 py-3 border-t border-muted', className)} {...props}>
    {children}
  </div>
}

/* Panel Components - Standardized replacements for the various .panel classes */
export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('rounded-xl border bg-background shadow-sm transition-shadow duration-200 hover:shadow-md', className)} {...props}>
    {children}
  </div>
}

export function PanelHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex items-center justify-between gap-4 px-5 py-4 border-b border-muted', className)} {...props}>
    {children}
  </div>
}

export function PanelContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
}

export function PanelFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex items-center justify-end gap-3 px-5 py-3 border-t border-muted', className)} {...props}>
    {children}
  </div>
}