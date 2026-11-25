import { countPendingSyncOperations, listSyncConflicts, listSyncOperations, recordSyncConflict, recordSyncOperation, resolveSyncConflict, type SyncConflict, type SyncDomain, type SyncOperation, offlineDb } from './db'
import { getOnlineStatus } from './api'

export type { SyncConflict, SyncDomain, SyncOperation }

export type SyncHandler = (operation: SyncOperation) => Promise<{ success: boolean; serverVersion?: unknown; error?: string }>

const handlerRegistry = new Map<SyncDomain, Map<string, SyncHandler>>()

export function registerSyncHandler(domain: SyncDomain, operation: string, handler: SyncHandler): void {
  if (!handlerRegistry.has(domain)) {
    handlerRegistry.set(domain, new Map())
  }
  handlerRegistry.get(domain)!.set(operation, handler)
}

export function unregisterSyncHandler(domain: SyncDomain, operation: string): void {
  handlerRegistry.get(domain)?.delete(operation)
}

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

export async function processQueue(scope: string): Promise<{ processed: number; blocked: number; failed: number; conflicts: number }> {
  if (!getOnlineStatus()) {
    return { processed: 0, blocked: await queueSize(scope), failed: 0, conflicts: 0 }
  }

  const operations = await listSyncOperations(scope)
  const pendingOps = operations.filter(op => 
    ['pending', 'processing', 'conflict', 'failed', 'blocked'].includes(op.status)
  )

  let processed = 0
  let failed = 0
  let conflicts = 0

  for (const operation of pendingOps) {
    const domainHandlers = handlerRegistry.get(operation.domain)
    if (!domainHandlers) {
      await updateOperationStatus(operation.id, 'blocked', `No handler registered for domain: ${operation.domain}`)
      failed++
      continue
    }

    const handler = domainHandlers.get(operation.operation)
    if (!handler) {
      await updateOperationStatus(operation.id, 'blocked', `No handler registered for operation: ${operation.operation}`)
      failed++
      continue
    }

    await updateOperationStatus(operation.id, 'processing')
    
    try {
      const result = await handler(operation)
      if (result.success) {
        await updateOperationStatus(operation.id, 'synced', undefined, result.serverVersion)
        processed++
      } else if (result.error?.includes('conflict') || result.error?.includes('version')) {
        await recordSyncConflict({
          operationId: operation.id,
          scope: operation.scope,
          reason: result.error || 'Server version conflict detected',
          localVersion: operation.payload,
          serverVersion: result.serverVersion,
        })
        conflicts++
      } else {
        await updateOperationStatus(operation.id, 'failed', result.error)
        failed++
      }
    } catch (error) {
      await updateOperationStatus(operation.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
      failed++
    }
  }

  const remainingBlocked = await queueSize(scope)
  return { processed, blocked: remainingBlocked, failed, conflicts }
}

async function updateOperationStatus(
  operationId: string,
  status: SyncOperation['status'],
  lastError?: string,
  serverRecordVersion?: unknown
): Promise<void> {
  const now = Date.now()
  const update: Partial<SyncOperation> = { status, updatedAt: now }
  if (lastError) update.lastError = lastError
  if (serverRecordVersion) update.serverRecordVersion = JSON.stringify(serverRecordVersion)
  await offlineDb.syncOperations.update(operationId, update)
}

export async function requestBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const syncRegistration = registration as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }
  if (syncRegistration.sync) await syncRegistration.sync.register('smis-sync')
}

export async function autoSyncOnReconnect(scope: string): Promise<{ processed: number; blocked: number; failed: number; conflicts: number } | null> {
  if (!getOnlineStatus()) return null
  
  const pendingCount = await queueSize(scope)
  if (pendingCount === 0) return { processed: 0, blocked: 0, failed: 0, conflicts: 0 }
  
  return processQueue(scope)
}
