import { getSession } from '../../api/auth'
import { readCached, writeCached, offlineScopeFor } from './db'
import { enqueueAuditedOperation, type SyncDomain } from './sync'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export type OfflineApiOptions = RequestInit & {
  cacheKey?: string
  cacheTtlMs?: number
  maxStaleMs?: number
  allowStaleOnNetworkError?: boolean
  syncDomain?: SyncDomain
  syncOperation?: string
  resourceKey?: string
  idempotencyKey?: string
}

function currentScope(): string | null {
  const session = getSession()
  return session?.username ? offlineScopeFor(session.username, session.roles) : null
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined' && typeof window !== 'undefined'
}

/**
 * Cache a successful, permission-scoped GET response in Dexie. Cache is only
 * used for network failures; HTTP authorization/server errors are never hidden.
 */
export async function readThroughCache<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  options: { ttlMs?: number; maxStaleMs?: number; allowStaleOnNetworkError?: boolean } = {},
): Promise<T> {
  const scope = currentScope()
  if (!scope || !canUseIndexedDb()) return loader()

  try {
    const fresh = await loader()
    try {
      await writeCached(cacheKey, scope, fresh, options.ttlMs ?? 30 * 60 * 1000)
    } catch {
      // IndexedDB quota or browser storage restrictions must not break online reads.
    }
    return fresh
  } catch (error) {
    const isNetworkFailure = typeof navigator !== 'undefined' && !navigator.onLine
      || error instanceof TypeError
    if (!isNetworkFailure || options.allowStaleOnNetworkError === false) throw error

    try {
      const cached = await readCached<T>(cacheKey, scope)
      if (cached && Date.now() - cached.updatedAt <= (options.maxStaleMs ?? 7 * 24 * 60 * 60 * 1000)) return cached.value
    } catch {
      // Preserve the original network error if local storage is unavailable.
    }
    throw error
  }
}

export async function offlineRequest<T>(path: string, options: OfflineApiOptions = {}): Promise<T> {
  const { 
    cacheKey, cacheTtlMs, maxStaleMs, allowStaleOnNetworkError, 
    syncDomain, syncOperation, resourceKey, idempotencyKey,
    ...init 
  } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  const token = sessionStorage.getItem('smis.accessToken') ?? localStorage.getItem('smis.accessToken')
  const load = async (): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: method === 'GET' ? 'no-store' : init.cache,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    })
    if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`)
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
  }

  if (method === 'GET' && cacheKey) {
    return readThroughCache(cacheKey, load, { ttlMs: cacheTtlMs, maxStaleMs, allowStaleOnNetworkError })
  }

  // For mutations, try online first, then queue for offline sync if network fails
  if (isMutation) {
    const isOnline = getOnlineStatus()
    if (!isOnline) {
      // Queue for offline sync
      if (syncDomain && syncOperation && resourceKey) {
        const scope = currentScope()
        if (scope) {
          await enqueueAuditedOperation({
            scope,
            domain: syncDomain,
            operation: syncOperation,
            resourceKey,
            payload: init.body ? JSON.parse(init.body as string) : {},
            idempotencyKey,
          })
        }
      }
      throw new Error('You are offline. This change has been queued for synchronization when connectivity is restored.')
    }

    try {
      return await load()
    } catch (error) {
      // If network error, queue for offline sync
      const isNetworkFailure = error instanceof TypeError || (error instanceof Error && error.message.includes('Failed to fetch'))
      if (isNetworkFailure && syncDomain && syncOperation && resourceKey) {
        const scope = currentScope()
        if (scope) {
          await enqueueAuditedOperation({
            scope,
            domain: syncDomain,
            operation: syncOperation,
            resourceKey,
            payload: init.body ? JSON.parse(init.body as string) : {},
            idempotencyKey,
          })
        }
        throw new Error('Network error. This change has been queued for synchronization when connectivity is restored.')
      }
      throw error
    }
  }

  return load()
}

export function getOnlineStatus(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
