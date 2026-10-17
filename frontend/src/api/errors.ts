/**
 * Converts API responses into user-facing messages.
 *
 * ASP.NET Core can return ProblemDetails, validation dictionaries, plain text,
 * or application-specific { message } objects. Never expose raw JSON to the UI.
 */
export async function readApiErrorMessage(response: Response): Promise<string> {
  const statusMessages: Record<number, string> = {
    400: 'Please review the information and correct any highlighted fields.',
    401: 'Your session has expired. Please sign in again.',
    403: 'Your account does not have permission to perform this action.',
    404: 'The requested record could not be found.',
    409: 'This change conflicts with an existing record. Review the details and try again.',
    413: 'The submitted information is too large. Reduce the size and try again.',
    429: 'Too many requests were made. Please wait a moment and try again.',
    500: 'Something went wrong on the server. Please try again. If the problem continues, contact your system administrator.',
    502: 'The service is temporarily unavailable. Please try again shortly.',
    503: 'The service is temporarily unavailable. Please try again shortly.',
    504: 'The request took too long. Please try again.',
  }

  const fallback = statusMessages[response.status] ??
    `We couldn't complete the request (error ${response.status}). Please try again.`
  const raw = await response.text().catch(() => '')
  if (!raw.trim() || response.status >= 500) return fallback

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    // Plain-text responses are safe to display when they are not server diagnostics.
    const text = raw.trim()
    if (text.startsWith('<') || /\b(exception|stack trace| at [\w.]+\()/i.test(text)) return fallback
    return text.length > 500 ? fallback : text
  }

  if (!payload || typeof payload !== 'object') return fallback
  const body = payload as Record<string, unknown>

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (message) return makeMessageHelpful(message)

  const detail = typeof body.detail === 'string' ? body.detail.trim() : ''
  // Do not expose ProblemDetails.detail on server errors; it can contain diagnostics.
  if (detail && response.status < 500) return makeMessageHelpful(detail)

  const errors = body.errors
  if (errors && typeof errors === 'object') {
    const messages = Object.values(errors as Record<string, unknown>)
      .flatMap(value => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string')
      .map(value => value.trim())
      .filter(Boolean)
    if (messages.length) return messages.slice(0, 4).join(' ')
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title && title.toLowerCase() !== 'one or more validation errors occurred.') {
    return makeMessageHelpful(title)
  }

  return fallback
}

function makeMessageHelpful(message: string): string {
  const normalized = message.trim().replace(/^\s+|\s+$/g, '')
  if (/staff member with this staff number already exists/i.test(normalized)) {
    return 'This staff number is already registered. Please enter a unique staff number or check the existing staff record.'
  }
  if (/already exists|duplicate key|unique constraint/i.test(normalized)) {
    return `${normalized.replace(/[.\s]+$/, '')}. Check the existing records and use a unique value.`
  }
  return normalized.length > 500 ? 'The request could not be completed. Please review your information and try again.' : normalized
}
