import { reportClientError } from './logging'

/** Standard error response shape from the API */
export interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
  statusCode?: number
  correlationId?: string
}

/** Extract user-friendly message from various error types */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Response) {
    return `Request failed with status ${error.status}`
  }
  
  if (error instanceof Error) {
    // Check for our custom API error responses
    if ('response' in error && error.response instanceof Response) {
      return `Request failed with status ${error.response.status}`
    }
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

/** Extract validation errors from API response */
export async function getValidationErrors(error: unknown): Promise<Record<string, string[]> | null> {
  if (error instanceof Response) {
    try {
      const data = await error.clone().json() as ApiErrorResponse
      return data.errors ?? null
    } catch {
      return null
    }
  }
  
  if (error instanceof Error && 'response' in error && error.response instanceof Response) {
    try {
      const data = await error.response.clone().json() as ApiErrorResponse
      return data.errors ?? null
    } catch {
      return null
    }
  }
  
  return null
}

/** Report error to backend with context */
export async function captureError(
  error: unknown,
  context: Record<string, unknown> = {},
  source = 'frontend'
): Promise<void> {
  const message = getErrorMessage(error)
  const stack = error instanceof Error ? error.stack : undefined
  
  await reportClientError(message, error as Error, source)
  
  // Also log locally
  console.error(`[${source}] ${message}`, { error, context, stack })
}

/** Wrapper for async functions that captures and reports errors */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context: Record<string, unknown> = {},
  source = 'frontend'
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      await captureError(error, { ...context, args }, source)
      throw error
    }
  }) as T
}

/** React Query error handler for mutations */
export function createMutationErrorHandler(
  defaultMessage: string,
  context: Record<string, unknown> = {}
) {
  return async (error: unknown) => {
    const message = getErrorMessage(error)
    await captureError(error, { ...context, operation: defaultMessage }, 'mutation')
    
    // Return user-friendly message for UI
    if (error instanceof Response) {
      if (error.status === 401) return 'Your session has expired. Please sign in again.'
      if (error.status === 403) return 'You do not have permission to perform this action.'
      if (error.status === 409) return 'This record has been modified by another user. Please refresh and try again.'
      if (error.status >= 500) return 'A server error occurred. Please try again later.'
    }
    
    return message || defaultMessage
  }
}

/** Global unhandled promise rejection handler */
export function installUnhandledRejectionHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault()
    void captureError(event.reason, { type: 'unhandledrejection' }, 'unhandledrejection')
  })
}

/** Global error event handler */
export function installGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    void captureError(event.error ?? event.message, { 
      type: 'globalerror',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    }, 'globalerror')
  })
}