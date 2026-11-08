# TanStack Query and offline server-state caching

## Responsibilities

- PostgreSQL remains the authoritative system of record.
- TanStack Query manages remote/server state in React: request de-duplication, stale-time caching, background refetch, retry and reconnect behaviour.
- The existing IndexedDB offline database remains the durable browser store and synchronisation queue. TanStack Query does not replace that queue.
- Mutations that need offline execution must continue through the auditable offline queue and server-side validation. Do not treat a paused or retried query as a durable write.

## Runtime policy

The application-wide QueryClient is configured with:

- 30-second default freshness and 24-hour garbage collection.
- Up to two retries for network/server failures; HTTP 4xx responses are not retried.
- networkMode online, so requests pause while the browser is offline and resume when connectivity returns.
- Refetch on reconnect and window focus.
- Mutations do not retry automatically. Existing financial and other sensitive writes keep their explicit synchronisation/idempotency/conflict controls.

## Persistent query cache

<<<<<<< HEAD
The existing `smis-offline` database remains managed by Dexie. Its schema is upgraded from version 2 to version 3, adding a dedicated `queryCache` table alongside the existing cache and synchronization stores. This avoids opening a second raw IndexedDB connection with a competing version-2 schema. Persisted query state is:
=======
The existing smis-offline IndexedDB database is upgraded from schema version 1 to 2 and receives a queryCache object store. Persisted query state is:
>>>>>>> origin/feat/tanstack-query-offline-cache

- Partitioned by authenticated username.
- Restored before the authenticated workspace mounts.
- Limited to 24 hours.
- Written only for successful queries whose metadata explicitly sets persist: true.
- Cleared from memory and deleted from IndexedDB when the user signs out or the authenticated username changes.

Persistence is an allowlist, not a blanket cache dump. The modern institutional dashboard aggregate and workflow summary are opted in. Student risk rows and Student 360 profiles contain identifiable and/or financial information and remain memory-only. Do not mark student, health, payroll, finance transaction, credential, or other sensitive record queries as persistent without a reviewed retention and device-security policy.

IndexedDB is browser-local storage, not encrypted storage. Shared workstation security, browser profile access and device controls remain important.

## First migrated workspace

ModernInformationHub now uses TanStack Query hooks for the modern dashboard, student risk list, workflow summary and selected Student 360 profile. The refresh action invalidates the modern query-key family. Existing data remains visible while a background refresh is running and cached dashboard aggregates can be shown offline after reload.

## Authentication lifecycle

The auth module emits an internal auth-changed event after login/session save and logout. Query state is cleared when the authenticated username changes; a previous user's persisted query cache is removed on sign-out/account switch. The cache is not shared between accounts on a workstation.

## Offline writes and conflict handling

TanStack Query is not the offline mutation queue. Do not enable automatic mutation persistence or retry for financial transactions, payroll, admissions decisions, inventory adjustments or other high-impact writes. Such writes must use:
- stable idempotency keys;
- authenticated server-side validation and authorization;
- explicit conflict detection/resolution;
- auditable queue state and retry outcomes;
- server confirmation before the UI marks the operation as committed.

## Rollout strategy

Adopt the query hooks module by module. Prefer query keys grouped by domain, invalidate affected keys after successful mutations, and opt in only low-risk query data for persistence. Keep existing API contracts and screen permissions unchanged during migration.
