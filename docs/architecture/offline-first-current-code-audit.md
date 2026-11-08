# Offline-first integration: current-code audit

Date: 2026-11-08
Base inspected: `main` at `b1c3503c2f04057d0e8882b61c62fc6758dab5e4`

This audit supplements the integration boundaries in
`offline-first-stack-integration.md`. It records what is present in the
application today so implementation can extend existing behavior rather than
introduce competing persistence or synchronization layers.

## Verified current implementation

- `frontend/src/lib/offline/db.ts` defines a Dexie database named
  `smis-offline`, with cache, sync-operation, and conflict stores. Its schema
  retains legacy stores during upgrades.
- `recordSyncOperation` currently writes new operations with status
  `blocked`; the module does not implement an automatic replay worker.
  Financial-like operations and payloads are explicitly rejected.
- `frontend/src/lib/offline/api.ts` caches successful, permission-scoped GET
  responses and uses stale data only after network failures. Mutations are
  rejected while offline; they are not silently queued.
- `frontend/src/App.tsx` persists the active module in browser storage.
  `ThemeToggle.tsx` and `i18n/index.ts` persist theme and locale preferences.
- The inspected frontend manifest has Zod, Dexie, Framer Motion, Chart.js and
  AG Grid, but does not yet declare React Hook Form, Zustand, FlexSearch,
  canvas-confetti, React-PDF, ElectricSQL, or Commander.
- No `useForm` usage was found in the repository search performed for this
  audit. Existing form migration must therefore be done screen-by-screen and
  preserve current validation and API payload contracts.

## Integration decisions based on the current code

### Forms: React Hook Form + Zod

1. Keep existing Zod schemas as the validation source of truth.
2. Add `zodResolver` and introduce typed form helpers in a shared form
   utility; do not wrap every input indiscriminately.
3. Migrate one representative form first, then high-value staff, student,
   admissions and inventory forms in separate changes.
4. Preserve server-side validation, duplicate checks, role checks and API
   request shapes. Client validation is not authorization.

### UI state: Zustand

1. Use Zustand for cross-screen UI state that currently needs prop drilling
   (for example, open panels, table preferences and transient filters).
2. Persist only non-sensitive preferences. Do not persist credentials,
   session tokens, student/staff records, grades, health records, payment
   details, or unsent sensitive form payloads in localStorage.
3. Keep Dexie as the local database for records/cache/queue state; do not
   duplicate those records in Zustand persistence.
4. Namespace persisted state by application version and clear or migrate
   incompatible state safely.

### Local search: FlexSearch

1. Build indexes from records already available to the signed-in user.
2. Scope index keys and lifecycle to the authenticated institution/user
   context; rebuild or discard the index when identity or permissions change.
3. Treat the index as a search accelerator only. Every read and mutation must
   still be authorized by the API.
4. Avoid indexing sensitive health, finance, credential, or other restricted
   fields unless a documented data classification and access policy explicitly
   permits it.

### Feedback: confetti and sound

1. Trigger feedback only after the operation's authoritative success response.
2. Respect reduced-motion preferences and provide a user setting to disable
   sound/celebrations.
3. Bundle any audio locally; no remote sound assets or CDN dependency.
4. Keep feedback non-blocking and never use it as the only success/error signal.

### PDF generation

1. Introduce React-PDF for new templates or a clearly isolated report type.
2. Keep existing print/export paths available until page-break, font, logo,
   pagination and UGX formatting parity is verified.
3. Bundle fonts and images locally so PDF generation works without internet.

### ElectricSQL

The existing Dexie sync-operation and conflict stores are only local data
structures; they are not proof that a synchronization server exists. Current
offline writes are blocked, and finance is deliberately excluded. Do not enable
replay or add an Electric client until a Postgres Shape service, authenticated
tenant-scoped subscriptions, server-side authorization, schema evolution,
tombstones, conflict policies and multi-workstation recovery tests are ready.
The .NET API remains the authoritative mutation path.

### CLI

Commander belongs in a separate Node maintenance CLI with explicit commands,
safe defaults and confirmation for destructive operations. It must not become
a browser dependency or replace .NET/EF Core migration tooling.

## Additional offline-build issue to address

The current `build:login-css` script invokes
`npx --yes tailwindcss@3.4.17`. That can download a package during a build and
therefore conflicts with the stated no-internet build requirement. Before
claiming fully offline builds, pin the required Tailwind CLI in the project
manifest/lockfile, make the script use the local binary, and verify a clean
build with network access disabled.

## Verification boundary

This is a source audit, not a runtime integration. The dependency manifest and
lockfile have not been changed in this PR. No new package behavior is claimed
or enabled. The frontend CI workflow was not triggered by the original
documentation-only PR because its path filter watches frontend files; the
observed PR checks were Foundation CI, Backend CI, and Vercel feedback checks.
A frontend build/test run is required once implementation changes touch
frontend files.
