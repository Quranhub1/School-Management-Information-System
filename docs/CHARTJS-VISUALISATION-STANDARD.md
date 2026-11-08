# SMIS Chart.js visualisation standard

## Single chart-rendering engine

**Chart.js 4.5.1 is the only chart-rendering engine used by the SMIS frontend.** It is installed as a frontend dependency and bundled locally by Vite. No chart may load scripts, stylesheets, fonts, or plugins from a CDN; the application must continue to work on the school LAN without internet access.

All charts in the SMIS interface must be implemented through the shared components in `frontend/src/components/charts/`:

- `ChartCanvas` — lifecycle-safe Chart.js canvas renderer for all supported Chart.js chart types.
- `DoughnutChart` — standard doughnut card with centre metric, accessible chart label, tooltip, legend and optional value formatting.
- `BarChart` — reusable bar/column chart with horizontal mode, multiple datasets, configurable value formatting and empty state.
- `charts.css` — shared responsive chart presentation and dark-theme support.
- `index.ts` — public component and type exports.

Do not add a second chart library, custom SVG chart, CSS-drawn data plot, or embedded third-party dashboard renderer to the SMIS frontend. Build any future line, pie, area, mixed, radar or other visualisations with `ChartCanvas` or a reusable wrapper in this folder.

## Current migration

- Administrator dashboard: student status, staff status, user accounts, fee collection and payroll status use the shared Chart.js doughnut component, including the finance-tab fee chart.
- Modern institutional dashboard: academic assessment and clinical placement rates use the shared Chart.js bar component; fee collection uses the shared doughnut component.
- Finance workspace: recent daily collections use the shared Chart.js bar component. Values are aggregated from the existing payment records.
- Analytics screen: the embedded Superset renderer and its frontend API client have been removed. Institutional analytics now use the same Chart.js-powered command centre.
- Existing API data sources, calculations, refresh behavior and authorization boundaries are preserved. Apache Superset infrastructure and backend configuration may remain available for separately managed external BI, but it is not an embedded SMIS chart renderer.

## Implementation rules

1. Chart values must come from the module's existing API/database response. Never introduce demonstration, random, or hard-coded business figures.
2. Keep aggregation and permission checks in the existing API/service layer. A chart is a presentation layer, not an authorization boundary.
3. Format monetary values in Uganda Shillings (UGX) using the existing `en-UG` conventions.
4. Every chart must have a descriptive title, an accessible text label, useful tooltips and an understandable empty state.
5. Tooltips and legends must identify the series/category and value. Do not rely on colour alone.
6. Charts must resize with their parent container and remain usable at desktop, tablet and phone widths.
7. Keep chart dependencies local so built desktop and LAN deployments do not need internet connectivity.
8. New charts in Finance, Human Resources/Payroll, Inventory, Admissions, Academics and every role dashboard must use this shared Chart.js layer.

## Verification required before merging

- Run `npm ci` and `npm run build` from `frontend/`.
- Run the existing frontend unit tests and relevant role-authorization tests.
- Check chart rendering with populated, empty and zero-valued API responses, narrow viewports, dark mode and offline operation.
- Confirm each role only receives the API data it is already authorized to view.
