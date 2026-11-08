# SMIS Chart.js visualisation standard

## Library

SMIS uses **Chart.js 4.5.1** as its shared chart-rendering engine. The package is a normal frontend dependency and is bundled by Vite with the application. Charts must not load scripts, stylesheets, fonts, or plugins from a CDN; the application must continue to work on the school LAN without internet access.

Shared components live in `frontend/src/components/charts/`:

- `ChartCanvas` — lifecycle-safe Chart.js canvas renderer. It destroys chart instances when the component unmounts or its configuration changes.
- `DoughnutChart` — standard SMIS doughnut card with a centre metric, accessible chart label, tooltip, and data legend.
- `charts.css` — responsive and dark-theme chart presentation.
- `index.ts` — public exports for chart components and types.

Use `ChartCanvas` for other Chart.js chart types (bar, line, pie, area via line fill, and mixed datasets). Add domain-specific wrappers in this folder when a chart pattern is reused by more than one module.

## Implementation rules

1. Chart values must come from the module's existing API/database response. Never introduce demonstration, random, or hard-coded business figures.
2. Keep aggregation and permission checks in the existing API/service layer. A chart is a presentation layer, not an authorization boundary.
3. Format monetary values using Uganda Shillings (UGX) and the existing `en-UG` conventions.
4. Every chart must have a descriptive title, an accessible text label, and an understandable empty state.
5. Tooltips and legends must identify the series/category and value. Do not rely on colour alone.
6. Charts must resize with their parent container and remain usable at desktop, tablet, and phone widths.
7. Keep chart dependencies local so built desktop and LAN deployments do not need internet connectivity.

## Current migration

- Administrator dashboard: student status, staff status, user accounts, fee collection, payroll status, and the finance-tab fee collection chart now use the shared Chart.js doughnut component.
- Existing metric loading, calculations, refresh behavior, and API calls are unchanged.
- Apache Superset remains the separate advanced BI option; it is not replaced by this embedded chart layer.

## Next module integrations

Adopt the shared renderer incrementally in Finance, Human Resources/Payroll, Inventory, Admissions, and Academic dashboards. For each chart, confirm the source endpoint, role permissions, date/term filters, aggregation rules, and empty/loading/error states before replacing existing visualisations.
