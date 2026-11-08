import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  dehydrate,
  hydrate,
  QueryClientProvider,
  type DehydratedState,
} from '@tanstack/react-query'
import { readQueryCache, writeQueryCache, removeQueryCache } from './offline/db'
import { getSession } from '../api/auth'
import { isPersistableQuery, queryClient, QUERY_CACHE_MAX_AGE } from './queryClient'

const CACHE_PREFIX = 'query-cache:'
const CACHE_BUSTER = 'smis-query-cache-v1'
const AUTH_CHANGED_EVENT = 'smis:auth-changed'

export function QueryCacheProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => getSession()?.username ?? null)
  const [restored, setRestored] = useState(false)
  const activeUsername = useRef(username)

  useEffect(() => {
    const onAuthChanged = () => {
      const nextUsername = getSession()?.username ?? null
      const previousUsername = activeUsername.current
      if (previousUsername === nextUsername) return
      if (previousUsername) {
        void removeQueryCache(CACHE_PREFIX + previousUsername).catch(() => undefined)
      }
      activeUsername.current = nextUsername
      setRestored(false)
      setUsername(nextUsername)
    }

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
  }, [])

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined
    let persistTimer: ReturnType<typeof setTimeout> | undefined

    queryClient.clear()

    const restoreAndSubscribe = async () => {
      if (!username) {
        if (!cancelled) setRestored(true)
        return
      }

      const storageKey = CACHE_PREFIX + username
      try {
        const record = await readQueryCache<DehydratedState>(storageKey)
        if (record && record.buster === CACHE_BUSTER && Date.now() - record.savedAt <= QUERY_CACHE_MAX_AGE && !cancelled) {
          hydrate(queryClient, record.state)
        } else if (record) {
          await removeQueryCache(storageKey)
        }
      } catch {
        // IndexedDB may be unavailable or disabled. The in-memory query cache still works.
      }

      if (cancelled) return
      setRestored(true)

      unsubscribe = queryClient.getQueryCache().subscribe(() => {
        if (cancelled) return
        if (persistTimer) clearTimeout(persistTimer)
        persistTimer = setTimeout(() => {
          const state = dehydrate(queryClient, {
            shouldDehydrateQuery: isPersistableQuery,
            shouldDehydrateMutation: () => false,
          })
          void writeQueryCache<DehydratedState>({
            key: storageKey,
            savedAt: Date.now(),
            buster: CACHE_BUSTER,
            state,
          }).catch(() => undefined)
        }, 300)
      })
    }

    void restoreAndSubscribe()

    return () => {
      cancelled = true
      unsubscribe?.()
      if (persistTimer) clearTimeout(persistTimer)
    }
  }, [username])

  return (
    <QueryClientProvider client={queryClient}>
      {restored
        ? children
        : <div role="status" aria-live="polite" className="workspace-loading">Restoring saved workspace data…</div>}
    </QueryClientProvider>
  )
}
