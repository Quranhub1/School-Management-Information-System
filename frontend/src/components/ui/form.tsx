import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Form({ className, children, ...props }: HTMLAttributes<HTMLFormElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <form className={cn('space-y-6', className)} {...props}>
    {children}
  </div>
}

export function FormField({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('space-y-2', className)} {...props}>
    {children}
  </div>
}

export function FormLabel({ className, htmlFor, ...props }: HTMLAttributes<HTMLLabelElement> & { 
  className?: string;
  htmlFor?: string;
}) {
  return <label 
    className={cn('text-sm font-medium text-foreground', className)} 
    htmlFor={htmlFor}
    {...props}
  >
    {props.children}
  </label>
}

export function FormHelp({ className, ...props }: HTMLAttributes<HTMLParagraphElement> & { 
  className?: string;
}) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props}>
    {props.children}
  </p>
}

export function FormError({ className, ...props }: HTMLAttributes<HTMLParagraphElement> & { 
  className?: string;
}) {
  return <p className={cn('text-xs text-destructive', className)} {...props}>
    {props.children}
  </p>
}

export function FormControl({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mt-2 w-full', className)} {...props}>
    {children}
  </div>
}