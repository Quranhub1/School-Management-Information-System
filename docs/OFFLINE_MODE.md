# Running SMIS Offline / LAN-Only

## Deployment modes

### Standard LAN deployment (recommended)

One Ubuntu server hosts the .NET API and PostgreSQL database. Client devices use the LAN URL. PostgreSQL remains authoritative and clients read live API data.

### Offline-capable client mode

The frontend PWA and Tauri WebView use a local Dexie.js database backed by IndexedDB. Dexie is a client-side cache and operation journal; it is not a second system of record and does not replace PostgreSQL.

## Implemented Dexie foundation

- `frontend/src/lib/offline/db.ts`: versioned Dexie schema and preserved v1 IndexedDB stores.
- `frontend/src/lib/offline/api.ts`: permission-scoped read-through cache. It uses cached data only after a network failure; HTTP 401/403 and other server errors are never hidden.
- `frontend/src/lib/offline/sync.ts`: durable, auditable operation journal, pending/conflict counts and explicit conflict records.
- `frontend/src/api/notices.ts`: first role-authorized read cache, with a 30-minute freshness window.
- `frontend/src/api/auth.ts`: clears the signed-out user's cached reads. Pending journal entries remain scoped to their originating user and are not replayed under another account.

The old IndexedDB stores are retained during schema migration. The legacy queue is no longer automatically replayed. No access tokens are persisted in the operation journal.

## Synchronisation safety boundary

**Automatic mutation replay is intentionally disabled.** The operation journal currently records operations as `blocked`; module-specific replay must not be enabled until its API contract, authorization, idempotency, server validation, retry policy and conflict handling are implemented and tested.

Offline mutations are rejected with a clear message and are not reported as saved. This applies to all modules in this foundation release.

### Financial operations — explicitly excluded

Payments, invoices, refunds, payroll and other financial operations cannot be added to the offline replay journal. Financial offline synchronisation requires all of the following first:

1. A client-generated idempotency key persisted with the operation and enforced by a unique server-side constraint.
2. Server-side validation of the authenticated user, finance permissions, student/invoice relationship, amount, currency, receipt/reference uniqueness and current invoice balance.
3. Atomic posting of the payment, allocations, ledger/journal effects and idempotency result in one PostgreSQL transaction.
4. Safe replay semantics: the same key and same request returns the original result; reuse with a different payload returns a conflict.
5. Explicit HTTP 409 conflict responses and a reviewable reconciliation workflow. A client must never resolve a financial conflict using last-write-wins.

## Data protection

- Cache entries are scoped by signed-in username and role set.
- Cached reads are cleared for the user on logout.
- IndexedDB is not automatically encrypted. Do not cache sensitive student, clinical, identity or financial payloads until device protection and data-minimisation requirements are approved.
- A cache is only a convenience. The API must re-authorize every online request and PostgreSQL remains authoritative.
- Offline cache freshness is visible in the cache metadata; expired data may be used only as a fallback during network failure.

## Next implementation stages

1. Add cache policies for approved, low-sensitivity read endpoints.
2. Add per-module operation handlers and server contracts, initially for low-risk workflows.
3. Implement optimistic concurrency/version checks and explicit 409 conflict resolution.
4. Add the financial idempotency and ledger-integrity controls above before any finance replay is considered.
5. Add device-level data protection, cache retention and multi-user device acceptance tests.

## Verification

Run from `frontend/`:

```bash
npm ci
npm run build
npm test
```

Then verify offline read fallback, online refresh, role/user cache isolation, logout cleanup, schema upgrade from existing IndexedDB v1, blocked mutation behaviour, and that no finance operation is replayed.


## Asynchronous local key-value state

The Dexie v4 `appState` store supports asynchronous namespaced key-value persistence for UI preferences and offline drafts. Use `getAppState`, `setAppState`, `deleteAppState` and `clearAppStateForScope` from `frontend/src/lib/offline/db.ts`. Namespace entries by signed-in user/role or another explicit owner scope. Do not persist credentials, sensitive personal data, financial records or authoritative server state. This reuses IndexedDB already bundled with SMIS; a separate `idb-keyval` dependency is intentionally not added.
