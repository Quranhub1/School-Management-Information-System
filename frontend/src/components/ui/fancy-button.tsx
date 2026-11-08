import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

export interface FancyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { 
  children: React.ReactNode
}

export const FancyButton = forwardRef<HTMLButtonElement, FancyButtonProps>(({ children, className, type = 'button', ...props }, ref) => {
  // Convert children to text if it's a string, or keep as is if it's already elements
  const textContent = typeof children === 'string' ? children : '';
  
  // If children is a string, split into letters for the text slide effect
  const letterSpans = typeof children === 'string' 
    ? children.split('').map((letter, index) => (
        <span key={index} aria-hidden>{letter}</span>
      ))
    : children;

  return (
    <button 
      ref={ref} 
      type={type} 
      className={[
        'fancy-button',
        className
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {/* Bubble layers */}
      <span className="bubble-layer-top" aria-hidden></span>
      <span className="bubble-layer-bottom" aria-hidden></span>

      {/* Text slide layers */}
      <span className="span-mother" aria-hidden>
        {letterSpans}
      </span>
      <span className="span-mother2" aria-hidden>
        {letterSpans}
      </span>
      
      {/* Fallback content for accessibility */}
      {!Array.isArray(children) && typeof children === 'string' && (
        <span className="sr-only">{children}</span>
      )}
    </button>
  );
});

FancyButton.displayName = 'FancyButton';
