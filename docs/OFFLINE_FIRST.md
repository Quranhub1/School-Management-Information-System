# Offline-First Architecture

## Authority and consistency

PostgreSQL on the SMIS server is the only authoritative database. Dexie.js provides a local IndexedDB cache and a durable client-side operation journal. A cached record is never treated as a committed server record.

## Current implementation

- Dexie.js 4.4.7 is bundled locally through npm; no CDN or runtime internet dependency is introduced.
- The Dexie schema is versioned and upgrades the existing `smis-offline` IndexedDB database without dropping its legacy stores.
- Read-through caching is scoped to the signed-in username and role set.
- The notices board is the first explicitly opted-in read endpoint, with a 30-minute TTL.
- Cached reads are returned only when a network failure prevents a live response. Authorization failures and other HTTP errors are surfaced.
- User-scoped cached reads are cleared on logout.
- The sync journal records operation identity, user scope, module, resource, idempotency key, timestamps, attempts, status and error details.
- Conflict records retain the reason and local/server version payloads for later review.

## Mutation policy

Automatic queue replay is disabled. The previous generic replay path could send arbitrary queued HTTP mutations without module-specific validation, idempotency or conflict semantics. It has been replaced with a blocked-by-default journal. Offline mutations currently fail clearly and are not represented as successfully saved.

Modules must be enabled individually only after their server-side API contract, authorization, idempotency, validation, retry and conflict tests are complete.

## Financial exclusion

No finance operation can be queued for offline replay. This includes payments, invoices, refunds, payroll and related ledger-affecting actions. Before financial synchronisation can be enabled, the backend must enforce a unique idempotency key, validate the complete transaction against current PostgreSQL state, atomically post all ledger effects, return the original result for exact retries, reject key/payload mismatches, and expose explicit 409 conflict handling. Financial conflicts require staff review; last-write-wins is prohibited.

## Data protection

IndexedDB is not encrypted by Dexie. Do not cache sensitive student identity, clinical, staff, or financial records without an approved device-protection and retention policy. All cache entries are isolated by user and role scope. Server-side authorization remains mandatory for every live API request.

## Planned rollout

1. Expand read caching only to approved low-sensitivity endpoints.
2. Introduce offline writes one module at a time, beginning with low-risk workflows.
3. Add optimistic concurrency/version checks and explicit conflict resolution.
4. Implement financial idempotency and atomic posting before considering any finance queue.
5. Add device data protection, retention controls, and multi-user/offline acceptance tests.


## Asynchronous key-value state

The Dexie v4 schema exposes `getAppState`, `setAppState`, `deleteAppState` and `clearAppStateForScope` for small structured-clone-compatible preferences and offline drafts. This reuses the existing Dexie database and preserves the dedicated TanStack Query cache. Always supply an explicit user/role namespace as `scope`. Do not store access tokens, secrets, sensitive personal data, financial transactions or authoritative server records. IndexedDB writes are asynchronous and callers must await them; storage quota or browser restrictions should be handled by the caller.
