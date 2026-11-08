import { getAccessToken } from '../api/auth'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogContext = Record<string, string | number | boolean | null | undefined>

let handlersInstalled = false
let reportingClientError = false

export function createCorrelationId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? 'smis-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function redact(value: string): string {
  return value
    .replace(/(bearer\s+)[a-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/(password|token|authorization|secret)\s*[:=]\s*[^&\s,;]+/gi, '$1=[REDACTED]')
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: redact(message),
    ...Object.fromEntries(
      Object.entries(context).map(([key, value]) => [
        key,
        typeof value === 'string' ? redact(value) : value,
      ]),
    ),
  }

  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else if (level === 'debug') console.debug(entry)
  else console.info(entry)
}

/**
 * Sends a bounded, redacted browser diagnostic to the authenticated API.
 * It deliberately excludes form values, request bodies, tokens and user profile data.
 */
export async function reportClientError(
  message: string,
  error?: Error,
  source = 'browser',
): Promise<void> {
  const correlationId = createCorrelationId()
  log('error', message, { source, correlationId })

  const token = getAccessToken()
  if (!token || reportingClientError) return

  reportingClientError = true
  try {
    await fetch('/api/diagnostics/client-errors', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify({
        message: redact(message).slice(0, 500),
        stack: redact(error?.stack ?? '').slice(0, 3000),
        source: redact(source).slice(0, 120),
        path: window.location.pathname.slice(0, 256),
        correlationId,
      }),
    })
  } catch {
    // Diagnostics must never create another user-facing failure or block the app.
  } finally {
    reportingClientError = false
  }
}

export function installGlobalErrorHandlers(): void {
  if (handlersInstalled || typeof window === 'undefined') return
  handlersInstalled = true

  window.addEventListener('error', event => {
    const error = event.error instanceof Error ? event.error : undefined
    void reportClientError(event.message || 'Unhandled browser error', error, 'window.error')
  })

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason
    const error = reason instanceof Error ? reason : undefined
    const message = error?.message
      ?? (typeof reason === 'string' ? reason : 'Unhandled promise rejection')
    void reportClientError(message, error, 'window.unhandledrejection')
  })
}
