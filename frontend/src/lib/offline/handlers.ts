import { offlineRequest } from './api'
import { registerSyncHandler, type SyncOperation } from './sync'
import { versionedPath } from '../apiVersion'

export function registerAllSyncHandlers(): void {
  // Students domain
  registerSyncHandler('students', 'create', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath('/api/students'), {
        method: 'POST',
        body: JSON.stringify(operation.payload),
        syncDomain: 'students',
        syncOperation: 'create',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync student' }
    }
  })

  registerSyncHandler('students', 'update', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath(`/api/students/${operation.resourceKey}`), {
        method: 'PUT',
        body: JSON.stringify(operation.payload),
        syncDomain: 'students',
        syncOperation: 'update',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync student update' }
    }
  })

  registerSyncHandler('students', 'delete', async (operation) => {
    try {
      await offlineRequest(versionedPath(`/api/students/${operation.resourceKey}`), {
        method: 'DELETE',
        syncDomain: 'students',
        syncOperation: 'delete',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync student deletion' }
    }
  })

  // Attendance domain
  registerSyncHandler('attendance', 'create', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath('/api/attendance'), {
        method: 'POST',
        body: JSON.stringify(operation.payload),
        syncDomain: 'attendance',
        syncOperation: 'create',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync attendance' }
    }
  })

  registerSyncHandler('attendance', 'update', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath(`/api/attendance/${operation.resourceKey}`), {
        method: 'PUT',
        body: JSON.stringify(operation.payload),
        syncDomain: 'attendance',
        syncOperation: 'update',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync attendance update' }
    }
  })

  // Library domain
  registerSyncHandler('library', 'create', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath('/api/library/loans'), {
        method: 'POST',
        body: JSON.stringify(operation.payload),
        syncDomain: 'library',
        syncOperation: 'create',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync library loan' }
    }
  })

  registerSyncHandler('library', 'return', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath(`/api/library/loans/${operation.resourceKey}/return`), {
        method: 'POST',
        body: JSON.stringify(operation.payload),
        syncDomain: 'library',
        syncOperation: 'return',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync library return' }
    }
  })

  // Messaging domain
  registerSyncHandler('messaging', 'send', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath('/api/messages'), {
        method: 'POST',
        body: JSON.stringify(operation.payload),
        syncDomain: 'messaging',
        syncOperation: 'send',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync message' }
    }
  })

  // Other domain (generic)
  registerSyncHandler('other', 'create', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath(operation.payload.path as string), {
        method: operation.payload.method as string,
        body: JSON.stringify(operation.payload.body),
        syncDomain: 'other',
        syncOperation: 'create',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync operation' }
    }
  })

  registerSyncHandler('other', 'update', async (operation) => {
    try {
      const response = await offlineRequest(versionedPath(operation.payload.path as string), {
        method: operation.payload.method as string,
        body: JSON.stringify(operation.payload.body),
        syncDomain: 'other',
        syncOperation: 'update',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true, serverVersion: response }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync operation' }
    }
  })

  registerSyncHandler('other', 'delete', async (operation) => {
    try {
      await offlineRequest(versionedPath(operation.payload.path as string), {
        method: 'DELETE',
        syncDomain: 'other',
        syncOperation: 'delete',
        resourceKey: operation.resourceKey,
        idempotencyKey: operation.idempotencyKey,
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to sync operation' }
    }
  })
}