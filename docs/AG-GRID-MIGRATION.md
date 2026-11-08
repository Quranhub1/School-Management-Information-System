# AG Grid Migration

## Decision

SMIS uses **AG Grid Community** for operational data tables. The selected packages are pinned to the same version:

- `ag-grid-react@36.3.0`
- `ag-grid-community@36.3.0`

AG Grid Community is MIT-licensed. This implementation does not import Enterprise packages, register Enterprise modules, or require a licence key.

## Shared implementation

`frontend/src/components/AgGridTable.tsx` is the shared React wrapper. It provides:

- Column sorting, per-column filtering and floating filters
- Column resizing and drag-to-reorder
- Pagination with 10, 25, 50 and 100 row page sizes
- Quick search across the grid
- CSV export
- Column visibility controls
- Multi-row selection
- Optional editable cells, with mutations delegated to the owning screen/API
- Compact, square-cornered Quartz theme consistent with SMIS density

## Migrated screens

- **FinanceManagement**: outstanding balances, recent payments, account collection and posted payment collections
- **InventoryManagement**: inventory registers, with permission-gated cell editing, custom columns, row deletion and existing database autosave
- **PayrollManagement**: payroll register, preserving payroll edit, mark-paid and refresh actions
- **StudentManagement**: student registry, preserving guardian management and QR-code actions
- **AccountsOverviewWorkspace**: outstanding balances, payment history and payroll summary
- **DefaulterManagement**: fee-defaulter list, follow-up actions and student invoice details
- **FeeTypesManager**: configured fee structures and application actions
- **InventoryStockAlerts**: low-stock and out-of-stock alerts
- **AuditLog**: searchable audit events with timestamp, entity, user and change details
- **Notices**: notice register
- **AdminDashboard**: student and staff search results use the shared grid; all five administrator donut visualisations now render through Chart.js 4.6.1

Chart.js is bundled through npm and rendered locally; no CDN, remote font, or runtime network request is needed for chart rendering.

The grid is a presentation layer. Existing API routes, backend validation, permission checks, and UGX formatting remain owned by the original feature screens.

## Deliberately not converted

This is not a blanket replacement of every HTML table. Keep semantic tables for admission-form layouts, education-history forms, timetable matrices, receipts/print documents, report-card layouts, and other fixed document structures. Additional operational lists should be migrated incrementally after their row actions and permission rules are mapped.

## Verification still required

The GitHub connector can commit source changes but cannot run the repository's local npm toolchain. Before merging, run from `frontend/`:

```bash
npm install
npm run build
npm test
```

Then manually verify:
- Finance, accounts overview, inventory and stock alerts, payroll, student registry, fee defaulters, fee structures, audit log and notices at desktop and narrow viewport widths
- Sorting, floating filters, quick search, pagination, column drag/reorder and column visibility
- CSV export contents and filenames
- Inventory edits autosave to the database and remain blocked for read-only roles
- Payroll edit and mark-paid actions still use the existing protected API
- Student guardian and QR actions still open the correct records

Do not merge to `main` until dependency installation, build, tests and manual checks pass.
