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
- Optional editable cells, with mutations delegated to the owning screen/API; Inventory is permission-gated and Zod-validated, while finance balances remain read-only and must use audited finance workflows
- Shift-click multi-column sorting and draggable/reorderable column headers
- Shared loading and empty-state overlays for asynchronous and zero-row grids
- Existing custom React cell renderers for finance statuses/amounts, payroll statuses, and row actions
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

The grid is a presentation layer. Existing API routes, backend validation, permission checks, and currency-aware formatting remain owned by the original feature screens.

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
- Inventory edits autosave to the database, pass the row Zod contract, and remain blocked for read-only roles
- Loading and empty overlays render correctly when the grid is fetching data or has no rows
- Shift-click multi-column sorting and drag-to-reorder work without breaking column visibility or filters
- Payroll edit and mark-paid actions still use the existing protected API
- Student guardian and QR actions still open the correct records

Do not merge to `main` until dependency installation, build, tests and manual checks pass.


## Search responsiveness

The shared grid toolbar keeps the text input controlled and responsive while `use-debounce` 10.1.1 delays the value passed to AG Grid by 300 ms. This optimization applies to client-side quick filtering in every screen using `AgGridTable`; it does not delay unrelated form inputs or financial submissions, and it does not debounce server API calls outside this shared grid. The debounce value is centralized so the delay can be tuned consistently. Clearing the search is subject to the same short debounce window.
