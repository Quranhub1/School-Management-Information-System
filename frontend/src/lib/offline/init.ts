import { registerAllSyncHandlers } from './handlers'
import { autoSyncOnReconnect } from './sync'
import { getSession } from '../../api/auth'
import { offlineScopeFor } from './db'

let initialized = false

export function initializeOfflineSync(): void {
  if (initialized) return
  initialized = true

  // Register all sync handlers
  registerAllSyncHandlers()

  // Set up periodic sync when online
  if (typeof window !== 'undefined') {
    const checkAndSync = async () => {
      const session = getSession()
      if (session?.username) {
        const scope = offlineScopeFor(session.username, session.roles ?? [])
        await autoSyncOnReconnect(scope)
      }
    }

    // Check on load
    void checkAndSync()

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkAndSync, 30 * 1000)

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
    })
  }
}