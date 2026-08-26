# Offline-First Architecture

## Goals

- The system must remain usable when the server is temporarily unreachable.
- Writes performed offline are preserved locally and synced automatically when the LAN/connection returns.
- No loss of attendance entries, finance records, or messaging during outages.

## Strategy

The system uses a **hybrid offline model**:

1. **Server-authoritative source of truth**
   - PostgreSQL on the Ubuntu server remains the primary database.
   - All final records, reports, and audits are server-based.

2. **Client-side local cache + write queue**
   - Frontend stores recent reads in IndexedDB for instant UI rendering.
   - Mutations performed while offline are queued in IndexedDB.
   - Background sync replays queued mutations when connectivity returns.

3. **Service Worker**
   - Caches app shell, JS/CSS bundles, and read-only API responses.
   - Serves cached UI when the API is unreachable.

## Offline-capable modules

| Module | Offline behavior |
|--------|-----------------|
| Login | Cached session + token; login itself requires server |
| Dashboard | Loads from cache; live numbers require server |
| Students | Search/create/update offline; syncs on reconnect |
| Attendance | Mark offline; syncs on reconnect |
| Finance | New invoices/payments offline; syncs on reconnect |
| Exams | Read-only offline; marks entry requires server |
| Library | Search offline; issue/return offline; syncs on reconnect |
| Messaging | Send offline; syncs on reconnect |
| Reports | Cached history; regenerate requires server |

## Conflict handling

- Last-write-wins for non-critical fields.
- Server rejects conflicts with `409 Conflict`; frontend prompts the user.
- Attendance, finance, and exam results use server-assigned timestamps.

## Data safety

- IndexedDB is persisted by the browser and survives restarts.
- Queue is processed in order.
- Failed sync items remain queued and are retried on next online event.
