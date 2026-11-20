import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineSyncCenter } from './OfflineSyncCenter'
import { getSyncConflicts, getSyncQueue, resolveSyncConflict } from '../lib/offline/sync'

vi.mock('../api/auth', () => ({
  getSession: () => ({ username: 'test.operator', roles: ['SystemAdministrator'] }),
}))
vi.mock('../lib/offline/api', () => ({
  getOnlineStatus: () => true,
}))
vi.mock('../lib/offline/db', () => ({
  offlineScopeFor: () => 'test.operator|SystemAdministrator',
}))
vi.mock('../lib/offline/sync', () => ({
  getSyncQueue: vi.fn(async () => [{
    id: 'operation-1',
    scope: 'test.operator|SystemAdministrator',
    domain: 'students',
    operation: 'update',
    resourceKey: 'student-1',
    payload: { firstName: 'Private' },
    idempotencyKey: 'key-1',
    status: 'blocked',
    attempts: 0,
    createdAt: 1000,
    updatedAt: 2000,
  }]),
  getSyncConflicts: vi.fn(async () => [{
    id: 'conflict-1',
    operationId: 'operation-1',
    scope: 'test.operator|SystemAdministrator',
    detectedAt: 3000,
    reason: 'The server record has changed.',
    resolutionStatus: 'unresolved',
  }]),
  resolveSyncConflict: vi.fn(async () => undefined),
}))

describe('OfflineSyncCenter', () => {
  afterEach(() => vi.clearAllMocks())

  it('loads local operations and conflicts without exposing payloads in the queue table', async () => {
    render(<OfflineSyncCenter />)

    expect(await screen.findByText('The server record has changed.')).toBeTruthy()
    expect(screen.getByText('student-1')).toBeTruthy()
    expect(screen.getByText('blocked')).toBeTruthy()
    expect(screen.queryByText('Private')).toBeNull()
    expect(getSyncQueue).toHaveBeenCalledWith('test.operator|SystemAdministrator')
    expect(getSyncConflicts).toHaveBeenCalledWith('test.operator|SystemAdministrator')
  })

  it('records a conflict review without enabling automatic replay', async () => {
    render(<OfflineSyncCenter />)

    fireEvent.click(await screen.findByRole('button', { name: 'Mark reviewed' }))

    await waitFor(() => {
      expect(resolveSyncConflict).toHaveBeenCalledWith('conflict-1', 'resolved')
    })
    expect(screen.getByText('Automatic replay is disabled')).toBeTruthy()
  })
  it('allows an operator to discard a conflicting operation without replaying it', async () => {
    render(<OfflineSyncCenter />)

    fireEvent.click(await screen.findByRole('button', { name: 'Discard queued operation' }))

    await waitFor(() => {
      expect(resolveSyncConflict).toHaveBeenCalledWith('conflict-1', 'discarded')
    })
    expect(screen.getByText(/Discarded operations remain in the audit journal/)).toBeTruthy()
  })

})
