import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/* Data Table Components */
export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <table className={cn('w-full text-sm text-left rtl:text-right border-collapse', className)} {...props}>
    {children}
  </table>
}

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <thead className={cn('bg-muted', className)} {...props}>
    {children}
  </thead>
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <tbody className={cn('divide-y', className)} {...props}>
    {children}
  </tbody>
}

export function TableFooter({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <tfoot className={cn('bg-muted', className)} {...props}>
    {children}
  </tfoot>
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <tr className={cn('border-b hover:bg-muted', className)} {...props}>
    {children}
  </tr>
}

export function TableHead({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <th className={cn('px-6 py-3 text-xs font-medium text-muted-foreground uppercase', className)} {...props}>
    {children}
  </th>
}

export function TableCell({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <td className={cn('px-6 py-4', className)} {...props}>
    {children}
  </td>
}

/* Badge Components */
export function Badge({ className, variant = 'default', children, ...props }: HTMLAttributes<HTMLSpanElement> & { 
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
}) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-primary text-primary',
    ghost: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive text-destructive-foreground',
  }
  
  return <span className={cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
    variantClasses[variant],
    className
  )}>
    {children}
  </span>
}

/* Alert Components */
export function Alert({ className, variant = 'default', children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}) {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  }
  
  return <div className={cn(
    'rounded-lg px-4 py-3 text-sm flex items-center gap-3',
    variantClasses[variant],
    className
  )} role="alert">
    {children}
  </div>
}

/* Progress Bar Components */
export function Progress({ className, value, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  value: number; // 0-100
}) {
  return (
    <div className={cn('w-full h-2.5 bg-muted rounded-full overflow-hidden', className)} {...props}>
      <div className={cn('h-full bg-primary transition-all duration-300')} style={{ width: `${value}%` }}></div>
    </div>
  )
}

/* Empty State Components */
export function EmptyState({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('text-center py-12 text-muted-foreground', className)} {...props}>
    {children}
  </div>
}

export function EmptyStateIcon({ className, ...props }: HTMLAttributes<HTMLElement> & { 
  className?: string;
}) {
  return <div className={cn('mx-auto h-12 w-12 text-muted-foreground', className)} {...props} />
}

export function EmptyStateTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement> & { 
  className?: string;
}) {
  return <h3 className={cn('mt-4 text-lg font-semibold text-foreground', className)} {...props}>
    {props.children}
  </h3>
}

export function EmptyStateDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement> & { 
  className?: string;
}) {
  return <p className={cn('mt-2 text-sm text-muted-foreground max-w-xl', className)} {...props}>
    {props.children}
  </p>
}