import { QueryClient, type Query, type QueryKey } from '@tanstack/react-query'

export const QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

export function isPersistableQuery<TQueryKey extends QueryKey>(query: Query<unknown, Error, unknown, TQueryKey>): boolean {
  return query.meta?.persist === true && query.state.status === 'success'
}

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status)
    if (Number.isFinite(status) && status >= 400 && status < 500) return false
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: QUERY_CACHE_MAX_AGE,
      retry: shouldRetryQuery,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
})
