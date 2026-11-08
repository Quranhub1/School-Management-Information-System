import { countPendingSyncOperations, listSyncConflicts, listSyncOperations, recordSyncConflict, recordSyncOperation, resolveSyncConflict, type SyncConflict, type SyncDomain, type SyncOperation } from './db'

export type { SyncConflict, SyncDomain, SyncOperation }

export function enqueueAuditedOperation(input: {
  scope: string
  domain: SyncDomain
  operation: string
  resourceKey: string
  payload: unknown
  idempotencyKey?: string
}): Promise<SyncOperation> {
  return recordSyncOperation(input)
}

export async function getSyncQueue(scope: string): Promise<SyncOperation[]> {
  return listSyncOperations(scope)
}

export async function queueSize(scope?: string): Promise<number> {
  return countPendingSyncOperations(scope)
}

export { recordSyncConflict, resolveSyncConflict }

export async function getSyncConflicts(scope: string): Promise<SyncConflict[]> {
  return listSyncConflicts(scope)
}

// Deliberately no automatic replay yet. Each module must register and pass its
// own server validation, idempotency, permission and conflict tests before its
// queued operations can be promoted from "blocked" to "pending".
export async function processQueue(): Promise<{ processed: number; blocked: number }> {
  return { processed: 0, blocked: await queueSize() }
}

export async function requestBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const syncRegistration = registration as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }
  if (syncRegistration.sync) await syncRegistration.sync.register('smis-sync')
}
