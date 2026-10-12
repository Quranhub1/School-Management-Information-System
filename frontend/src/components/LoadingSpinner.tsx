import React from 'react';

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

/** Shared accessible loading indicator for SMIS screens. */
export default function LoadingSpinner({ label = 'Loading…', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-state ${className}`.trim()} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => <span key={index} />)}
      </span>
      <span>{label}</span>
    </div>
  );
}
