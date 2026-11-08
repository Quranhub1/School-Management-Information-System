# AG Grid Migration

## Decision

SMIS uses **AG Grid Community** for operational data tables. The selected packages are pinned to the same version:

- `ag-grid-react@36.3.0`
- `ag-grid-community@36.3.0`

AG Grid Community is MIT-licensed. The implementation must not import `ag-grid-enterprise`, register Enterprise modules, or require a licence key.

## Shared implementation

- `frontend/src/components/AgGridTable.tsx` is the shared React wrapper.
- It standardises sorting, filtering, column resizing, pagination, compact row sizing and the Inter font.
- Feature screens provide typed column definitions and row data; API contracts and backend data models remain unchanged.

## Migrated in this change

The Finance & Accounting workspace's four main data tables now use the shared AG Grid wrapper:

- Read-only outstanding balances
- Read-only recent payments
- Student account collection overview
- Posted payment collections

Existing search inputs continue to filter the same data before it reaches the grid. Currency remains formatted as UGX.

## Remaining migration

This is a staged migration, not a blanket replacement of every HTML table. Remaining operational registers and lists should be migrated screen-by-screen, preserving row actions, inline editing, access controls, exports and print behaviour. Tables used as form layouts, timetable matrices, receipt/print documents, or other fixed document layouts should remain semantic HTML unless they are intentionally redesigned as interactive data grids.

## Verification required

Run from `frontend/` after installing dependencies:

```bash
npm ci
npm run build
npm test
```

Check the Finance workspace in browser and desktop builds at narrow and wide widths, including empty/loading states and sorting/filtering/pagination. Do not merge to `main` until CI and manual checks pass.
