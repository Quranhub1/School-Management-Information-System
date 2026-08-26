# Running SMIS Offline / LAN-Only

## Option A — Standard LAN deployment (recommended)

This is the normal Ubuntu-server setup. One machine runs the server; clients use browsers.

1. Run `infrastructure/scripts/setup-server.sh` on Ubuntu Server.
2. Clients open `http://<SERVER-IP>` in any browser.

Advantages:
- Fast, simple, maintainable
- Central database and backups
- All existing features work unchanged

## Option B — True offline-first desktop mode

Use this when the server may be offline and you still need data entry to continue.

### Frontend PWA + IndexedDB

The frontend now includes:
- Service worker (`frontend/public/sw.js`)
- App shell caching
- IndexedDB stores for reads and write queue
- Background sync when connectivity returns

Files:
- `frontend/public/sw.js`
- `frontend/public/manifest.json`
- `frontend/src/lib/offline/db.ts`
- `frontend/src/lib/offline/sync.ts`
- `frontend/src/lib/offline/api.ts`

### Install as desktop app (Electron wrapper)

To run SMIS as a desktop app on a Windows/macOS/Linux machine:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Wrap the `dist` folder with Electron and a local .NET API + SQLite backend.

This packaging step is not yet automated in the repo, but the frontend offline layer is ready.

## Offline behavior summary

| Action | Offline behavior |
|--------|-----------------|
| Login | Works if session was previously cached |
| View students, timetable, reports | Loads from cache |
| Mark attendance | Saves to IndexedDB queue; syncs when online |
| Create invoice / payment | Queued; syncs when online |
| Send message | Queued; syncs when online |
| Issue library book | Queued; syncs when online |
| PWA install | Available via browser install prompt |

## Conflict resolution

- Last-write-wins for non-critical fields.
- Server returns `409 Conflict` when a queued mutation conflicts; the UI prompts the user.
