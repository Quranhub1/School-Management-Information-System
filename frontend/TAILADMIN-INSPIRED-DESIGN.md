# TailAdmin-inspired SMIS workspace styling

This change adapts general dashboard UX patterns for SMIS: a light operational shell, grouped sidebar navigation, compact metric cards, chart panels, responsive layouts, clear active states, and dark-mode overrides.

## Scope and safety

- The implementation is a local SMIS stylesheet at `src/tailadmin-inspired.css`; it does not import TailAdmin runtime code, templates, fonts, images, or remote assets.
- Existing SMIS routes, role guards, API calls, forms, and dashboard data sources remain in their existing React components.
- No mock metrics or demo records are introduced.
- The stylesheet is imported from `src/main.tsx`, so it works without a network connection.
- The inspiration reference is TailAdmin's free React dashboard: https://github.com/TailAdmin/free-react-tailwind-admin-dashboard
- Review the upstream repository's current LICENSE and any separately licensed assets before copying upstream code or assets in future work. This change is an original styling adaptation rather than a copy of its source files.

## Validation still required

Run `npm run build` and `npm test` from `frontend`, then inspect System Administrator, role-specific dashboards, small-screen navigation, and dark mode against real backend data.
