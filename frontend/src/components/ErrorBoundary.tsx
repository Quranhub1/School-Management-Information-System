import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Bug } from 'lucide-react'
import { reportClientError } from '../lib/logging'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo })
    
    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Report to backend
    void reportClientError(
      `React Error Boundary: ${error.message}`,
      error,
      'error-boundary'
    )
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <AlertCircle size={48} />
            </div>
            <h2>Something went wrong</h2>
            <p className="error-boundary-message">
              We're sorry, but an unexpected error occurred. Our team has been notified.
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo?.componentStack && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <div className="error-boundary-actions">
              <button
                className="primary-button"
                type="button"
                onClick={this.handleRetry}
              >
                <RefreshCw size={16} /> Try again
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => window.location.reload()}
              >
                <Bug size={16} /> Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}