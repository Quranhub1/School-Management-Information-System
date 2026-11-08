# Offline-first frontend and workstation tooling integration

Status: approved architecture; staged implementation required

This note records the integration boundary for the SMIS React/Vite/Tauri client and the .NET 8/PostgreSQL server. The application must remain usable without internet access. Package installation is not considered complete until both package.json and package-lock.json are updated together and a clean npm ci/build succeeds.

## Existing foundations to preserve

- React 19 + Vite 7 + TypeScript
- Zod 4 for validation contracts
- Dexie 4 / IndexedDB for browser-side offline persistence
- PostgreSQL as the authoritative shared database
- .NET 8 API as the existing authenticated business-logic boundary
- AG Grid Community for large registers
- Chart.js for analytics
- Framer Motion for UI transitions
- Existing CSV/export/printing and document-generation flows

Do not introduce a second authoritative database or bypass the API's authorization, audit, validation, or transaction rules.

## Dependency plan

### Frontend runtime dependencies

- react-hook-form: migrate complex forms incrementally; retain existing field names and API payload contracts.
- @hookform/resolvers: use zodResolver with existing Zod schemas. Check compatibility with the repository's pinned Zod and React versions before selecting the resolver release.
- zustand: small shared UI/workflow state only. Use persist selectively for harmless preferences and explicitly opted-in drafts.
- flexsearch: build indexes from locally available, permission-filtered data; update/remove index entries when Dexie records change.
- canvas-confetti: invoke only after confirmed successful operations, never as a substitute for a server response.
- @react-pdf/renderer: introduce for new component-driven document templates only after comparing against the existing PDF engine and preserving existing document output.
- @electric-sql/client: do not activate in the browser until an Electric service, authentication/authorization model, LAN topology, replication rules, and PostgreSQL publication configuration have been designed and deployed.

### Workstation/development tooling

- commander: add only to a Node-based maintenance CLI under frontend/scripts or a dedicated tools package. Keep .NET migrations and server maintenance in the .NET toolchain; do not ship Node CLI code to the browser.
- @types/canvas-confetti: add if required by the selected canvas-confetti release.

## Offline and synchronization design

Dexie remains the local read/write cache for the current application. Existing API write paths remain authoritative. Queue only explicitly supported idempotent operations, with stable operation IDs, retry/backoff, and visible pending/failed states.

ElectricSQL is a separate future LAN synchronization service, not a replacement for Dexie and not an embedded SQLite adapter. Before enabling it:
1. Define the on-premises Electric service deployment and supported version.
2. Define per-table shape exposure and tenant/institution scoping.
3. Ensure row-level authorization is enforced before data reaches a workstation.
4. Define conflict policy by entity: immutable audit events append; counters/stock use server-side transactions; student/staff master records use version checks and explicit conflict review where automatic merge is unsafe.
5. Define deletion/tombstone behavior, schema migration order, backups, recovery, and sync observability.
6. Test two or more workstations disconnecting, editing the same record, reconnecting in different orders, and recovering after a service restart.

Never assume generic operational transforms safely resolve business conflicts such as payments, stock movements, attendance, grades, or clinical records.

## Persistence and privacy

Persist only UI preferences and explicitly saved, non-sensitive drafts. Do not persist access/refresh tokens, passwords, clinical details, payment credentials, or unrestricted student/staff records in Zustand localStorage. Use Dexie with institution/user scoping, retention rules, encryption decisions appropriate to the deployment, and logout cleanup. Treat browser storage as workstation-local and potentially shared.

## Search

FlexSearch indexes must be built from records already available to the signed-in user. Rebuild or incrementally update indexes after sync/cache invalidation; clear them on logout or institution change. Search results must never grant access: the API remains the authorization boundary.

## Feedback

Use local bundled audio assets or Web Audio oscillator tones; no remote audio URLs. Respect reduced-motion/accessibility preferences and a user setting to disable sound. Success feedback is emitted only after the authoritative operation succeeds; error feedback must not disclose sensitive values.

## PDF and CLI boundaries

Keep existing PDFs stable while React-PDF templates are introduced and compared. Validate page breaks, embedded local fonts, headers/footers, tables, accessibility, and output size. No remote fonts or assets.

Commander scripts must be local, documented, non-interactive in CI where possible, and guarded against destructive actions. Backups, migrations, and seed operations must require explicit target/environment confirmation and must never silently target production.

## Acceptance gates

- package.json and package-lock.json agree; clean npm ci works offline from the approved local package cache.
- TypeScript check, unit tests, production Vite build, and Tauri packaging pass.
- No runtime requests to public CDNs, Google Fonts, remote audio, or external asset hosts.
- Existing API payloads, role guards, audit events, and offline login remain unchanged.
- Multi-workstation sync is not marked production-ready until conflict, authorization, recovery, and LAN failure tests pass.
