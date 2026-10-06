import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Tabs({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex h-10 items-center justify-center rounded-md border border-background bg-muted px-2', className)} {...props}>
    {children}
  </div>
}

export function Tab({ className, children, isSelected, onClick, ...props }: HTMLAttributes<HTMLButtonElement> & { 
  className?: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
        isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        className
      )}
      onClick={onClick}
      aria-selected={isSelected ?? false}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabList({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex space-x-1', className)} {...props}>
    {children}
  </div>
}

/* Segmented Control - Alternative to tabs for secondary navigation */
export function SegmentedControl({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex h-10 items-center justify-center rounded-md border border-background bg-muted px-2', className)} {...props}>
    {children}
  </div>
}

export function Segment({ className, children, isSelected, onClick, ...props }: HTMLAttributes<HTMLButtonElement> & { 
  className?: string;
  children: React.ReactNode;
  isSelected?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
        isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
        className
      )}
      onClick={onClick}
      aria-selected={isSelected ?? false}
      {...props}
    >
      {children}
    </button>
  )
}