import Dexie, { type Table } from 'dexie'

export type CacheEntry<T = unknown> = {
  key: string
  scope: string
  value: T
  updatedAt: number
  expiresAt: number
}

export type SyncDomain = 'students' | 'attendance' | 'library' | 'messaging' | 'other'
export type SyncStatus = 'pending' | 'processing' | 'synced' | 'conflict' | 'failed' | 'blocked'

export type SyncOperation = {
  id: string
  scope: string
  domain: SyncDomain
  operation: string
  resourceKey: string
  payload: unknown
  idempotencyKey: string
  status: SyncStatus
  attempts: number
  createdAt: number
  updatedAt: number
  lastError?: string
  serverRecordVersion?: string
}

export type SyncConflict = {
  id: string
  operationId: string
  scope: string
  detectedAt: number
  reason: string
  localVersion?: unknown
  serverVersion?: unknown
  resolutionStatus: 'unresolved' | 'resolved' | 'discarded'
  resolvedAt?: number
}

class SmisOfflineDatabase extends Dexie {
  cacheEntries!: Table<CacheEntry, string>
  syncOperations!: Table<SyncOperation, string>
  syncConflicts!: Table<SyncConflict, string>

  // Retain the v1 stores during the upgrade so existing browser data is not
  // dropped. The legacy queue is deliberately no longer replayed.
  constructor() {
    super('smis-offline')
    this.version(1).stores({
      queue: '++id',
      students: '&id, studentCode',
      attendance: '&id, sessionId',
      finance: '&id',
      settings: '&key',
    })
    this.version(2).stores({
      queue: '++id, createdAt',
      students: '&id, studentCode',
      attendance: '&id, sessionId',
      finance: '&id',
      settings: '&key',
      cacheEntries: '&key, scope, expiresAt, updatedAt',
      syncOperations: '&id, scope, domain, status, createdAt, updatedAt, idempotencyKey, [scope+status]',
      syncConflicts: '&id, operationId, scope, detectedAt, resolutionStatus',
    })
  }
}

export const offlineDb = new SmisOfflineDatabase()

export function offlineScopeFor(username: string, roles: string[] = []): string {
  return [username.trim().toLowerCase(), [...roles].sort().join(',')].join('|')
}

export async function readCached<T>(key: string, scope: string): Promise<CacheEntry<T> | undefined> {
  return offlineDb.cacheEntries.get(`${scope}::${key}`) as Promise<CacheEntry<T> | undefined>
}

export async function writeCached<T>(key: string, scope: string, value: T, ttlMs: number): Promise<void> {
  const now = Date.now()
  await offlineDb.cacheEntries.put({
    key: `${scope}::${key}`,
    scope,
    value,
    updatedAt: now,
    expiresAt: now + ttlMs,
  })
}

export async function invalidateCachedRead(key: string, scope?: string): Promise<void> {
  if (scope) {
    await offlineDb.cacheEntries.delete(`${scope}::${key}`)
    return
  }
  await offlineDb.cacheEntries.filter(entry => entry.key.endsWith(`::${key}`)).delete()
}

export async function clearCacheForUser(username: string): Promise<void> {
  const prefix = `${username.trim().toLowerCase()}|`
  await offlineDb.cacheEntries.where('scope').startsWith(prefix).delete()
}

function containsFinancialPayload(value: unknown, depth = 0): boolean {
  if (depth > 8 || value === null || typeof value !== 'object') return false
  const financialKeys = /^(amount|currency|receipt(number)?|payment(method|id)?|invoice(id|number)?|refund|payroll|ledger|journal|paidamount|balance)$/i
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) =>
    financialKeys.test(key.replace(/[_-]/g, '')) || containsFinancialPayload(nested, depth + 1),
  )
}

export async function recordSyncOperation(
  input: Omit<SyncOperation, 'id' | 'status' | 'attempts' | 'createdAt' | 'updatedAt' | 'idempotencyKey'> & { idempotencyKey?: string },
): Promise<SyncOperation> {
  if (/finance|payment|invoice|refund|payroll/i.test(`${input.domain} ${input.operation} ${input.resourceKey}`) || containsFinancialPayload(input.payload)) {
    throw new Error('Financial operations cannot be queued for offline replay.')
  }

  const now = Date.now()
  const operation: SyncOperation = {
    ...input,
    id: crypto.randomUUID(),
    idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
    status: 'blocked',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  }
  await offlineDb.syncOperations.add(operation)
  return operation
}

export async function listSyncOperations(scope: string): Promise<SyncOperation[]> {
  return offlineDb.syncOperations.where('scope').equals(scope).reverse().sortBy('createdAt')
}

export async function countPendingSyncOperations(scope?: string): Promise<number> {
  const query = offlineDb.syncOperations.where('status').anyOf('pending', 'processing', 'conflict', 'failed', 'blocked')
  return scope ? query.and(item => item.scope === scope).count() : query.count()
}

export async function recordSyncConflict(conflict: Omit<SyncConflict, 'id' | 'detectedAt' | 'resolutionStatus'>): Promise<void> {
  const now = Date.now()
  await offlineDb.transaction('rw', offlineDb.syncConflicts, offlineDb.syncOperations, async () => {
    await offlineDb.syncConflicts.put({
      ...conflict,
      id: crypto.randomUUID(),
      detectedAt: now,
      resolutionStatus: 'unresolved',
    })
    await offlineDb.syncOperations.update(conflict.operationId, {
      status: 'conflict',
      updatedAt: now,
      lastError: conflict.reason,
    })
  })
}

export async function listSyncConflicts(scope: string): Promise<SyncConflict[]> {
  return offlineDb.syncConflicts.where('scope').equals(scope).reverse().sortBy('detectedAt')
}

export async function resolveSyncConflict(
  conflictId: string,
  resolutionStatus: 'resolved' | 'discarded',
): Promise<void> {
  const now = Date.now()
  await offlineDb.syncConflicts.update(conflictId, { resolutionStatus, resolvedAt: now })
}
