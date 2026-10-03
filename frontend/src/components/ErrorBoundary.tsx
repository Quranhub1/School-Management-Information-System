import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Something went wrong while loading the application.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AppErrorBoundary caught an error', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="screen-error">
          <div className="error-boundary-card">
            <div className="error-boundary-kicker">System error</div>
            <h2>Something went wrong.</h2>
            <p>{this.state.message}</p>
            <button type="button" className="primary-button" onClick={this.handleReset}>
              Reload app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
