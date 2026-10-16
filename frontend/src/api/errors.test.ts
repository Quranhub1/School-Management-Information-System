import { describe, expect, it } from 'vitest'
import { readApiErrorMessage } from './errors'

describe('readApiErrorMessage', () => {
  it('turns duplicate staff-number responses into actionable guidance', async () => {
    const response = new Response(JSON.stringify({ message: 'A staff member with this staff number already exists.' }), { status: 400 })
    await expect(readApiErrorMessage(response)).resolves.toBe(
      'This staff number is already registered. Please enter a unique staff number or check the existing staff record.',
    )
  })

  it('extracts field validation messages from ASP.NET validation responses', async () => {
    const response = new Response(JSON.stringify({
      title: 'One or more validation errors occurred.',
      errors: { FirstName: ['First name is required.'], Email: ['Email is invalid.'] },
    }), { status: 400 })
    await expect(readApiErrorMessage(response)).resolves.toBe('First name is required. Email is invalid.')
  })

  it('uses a friendly session message for unauthorized responses without a body', async () => {
    const response = new Response('', { status: 401 })
    await expect(readApiErrorMessage(response)).resolves.toBe('Your session has expired. Please sign in again.')
  })

  it('does not expose server diagnostics from a 500 response', async () => {
    const response = new Response(JSON.stringify({ title: 'Internal Server Error', detail: 'Sensitive stack trace and database credentials' }), { status: 500 })
    await expect(readApiErrorMessage(response)).resolves.toBe(
      'Something went wrong on the server. Please try again. If the problem continues, contact your system administrator.',
    )
  })
})
