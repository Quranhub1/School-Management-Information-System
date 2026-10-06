import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, className: classNameProp, ...props }: HTMLAttributes<HTMLDivElement> & { 
  className?: string,
  classNameProp?: string,
}) {
  const classNameValue = classNameProp ?? className;
  return <div 
    className={cn(
      'rounded-xl border bg-white shadow-sm transition-shadow duration-200 hover:shadow-md',
      'border-border',
      classNameValue
    )}
    {...props} 
  />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold tracking-tight text-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0 space-x-2', className)} {...props} />
}
