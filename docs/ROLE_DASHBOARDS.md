# Role-Specific Dashboards and Data Visualization Standard

**Status:** Required design and implementation target; not yet complete for every role.  
**Applies to:** All authenticated SMIS role dashboards and all tabular/register screens.  
**Design baseline:** Approved SMIS visual system (glassmorphism surfaces, consistent cards, responsive layout and institutional branding).

## Product rule

Every role should land on a dashboard that summarizes the live information and outstanding work relevant to its responsibilities. Dashboard content must align with the signed-in user's effective permissions and the modules shown in that user's sidebar. A dashboard is an overview, not a way to bypass module authorization.

A role-specific dashboard is **not considered complete** merely because it has KPI cards or a chart. It must use real API/database data, show loading/empty/error states, provide useful navigation to permitted work, and avoid exposing restricted data.

## Dashboard content by role family

| Role / role family | Relevant dashboard information | Access boundary |
|---|---|---|
| System Administrator | Institution-wide student/staff counts, user and system activity, enrollment/attendance trends, operational alerts and authorized cross-module summaries | Administrative scope; sensitive finance details only where explicitly authorized |
| Principal / Deputy Principal / Director | Enrollment, attendance, academic outcomes, departmental summaries, staff overview and leadership alerts | Read-only data stays read-only; finance summary only when authorized |
| Academic Registrar / Assistant Academic Registrar | Admissions and enrollment progression, programme/class distribution, attendance and assessment/result completion, timetable and academic-record follow-up | Academic and student-record permissions |
| Accountant / Assistant Accountant | Invoices, collections, outstanding balances, expenditure/reporting and assigned finance tasks | Follow finance permission and separation-of-duties rules; do not infer approval rights from dashboard visibility |
| HR Manager | Staff headcount, department distribution, attendance/leave, recruitment/onboarding and assigned HR follow-ups | Staff/HR permissions; payroll/allowances only when explicitly permitted |
| Admin Secretary | Administrative workload, student-record completeness, admission activity, document follow-up, inventory/stock overview and permitted operational alerts | Broad administration access as configured; no finance/accounting access |
| Receptionist | Visitor/gate activity, admission enquiries, permitted student lookup and upcoming notices/events | Front-desk scope; no finance/accounting access |
| Records Person / Records Officer | Student-record completeness, document status, records needing attention, inventory register summaries and stock condition | Records and retained inventory permissions; no Store Officer role required |
| Teacher / Lecturer | Assigned class/course attendance, lessons/timetable, assessments and students needing academic follow-up | Assigned teaching groups/courses only |
| Head of Department | Department-level academic performance, course/class coverage, attendance, staff and assessment follow-up | Department scope unless a separate permission grants wider visibility |
| School Warden | Check-in/check-out, inspections, maintenance requests, incidents/indiscipline and reports | Warden functions; do not expose room/bed/occupancy allocation if excluded from the role |
| Librarian | Loans, returns, overdue items, circulation and catalogue work | Library scope |
| Health Records / clinical staff | Recent visits, case follow-up and permitted health-service activity | Health permissions; sensitive clinical details must remain protected |
| Guild officials / members | Relevant guild activities, election/representation tasks, participation and notices | Assigned guild role and workflow permissions only |
| Other configured roles | KPIs, charts, alerts and shortcuts mapped to that role's real responsibilities | Least privilege; no extra access solely because data appears on a dashboard |

The table is a content standard, not a claim that all listed dashboards have already been implemented or verified.

## Visualization rules

- Use **line charts** for trends over time, **bar charts** for comparisons between classes/departments/periods, and **donut charts** only for meaningful parts of a whole.
- Use KPI cards for concise totals and status counts; use tables for actionable detail and drill-down.
- Prefer institution-configured academic periods, dates and eligibility thresholds instead of hardcoded assumptions.
- Use Uganda's institutional context and UGX formatting where finance is shown.
- Every chart must have a meaningful title, readable labels/legend, useful empty state and accessible text alternative or summary.
- Charts must not fabricate zeroes when data failed to load. Distinguish genuine zero from unavailable data.
- Do not render charts that duplicate no meaningful decision or expose sensitive data without permission.

## Authorization and data integrity

1. Derive dashboard sections from the effective role permissions, not from a role name alone where granular permissions exist.
2. Backend API authorization remains authoritative. Hiding a card or sidebar item is not security.
3. Use live backend responses; do not ship demo arrays or local-storage values as authoritative school statistics.
4. Limit queries and aggregates to the user's authorized scope (for example, assigned class or department).
5. Treat finance, payroll, student medical data and identity details as sensitive. Show only the minimum summary permitted.
6. Each shortcut must navigate to a module the user is allowed to open, and its write actions must match the user's actual permissions.
7. Handle loading, request failure, empty data, stale data and partial endpoint failure explicitly.

## Shared table/register layout

All data tables and register-style sheets should provide consistent layout behavior:
- Drag-resizable column widths and row heights where appropriate.
- Keyboard-accessible resize handles.
- Horizontal scrolling on narrow screens and sensible minimum sizes.
- Print output without interactive resize handles.
- No change to the underlying records when changing presentation dimensions.

The current shared table-resize implementation is an initial UI enhancement. Persistence of layout preferences across sessions and per-table exceptions still require explicit implementation and verification.

## Implementation and verification checklist

- [ ] Audit every role and its actual sidebar/module permissions.
- [ ] Map each role to real backend endpoints and permitted data scope.
- [ ] Build or adapt a distinct dashboard for every configured role/role family.
- [ ] Replace placeholder/demo chart values with live, permission-scoped aggregates.
- [ ] Add loading, empty, error and partial-failure states.
- [ ] Ensure dashboard cards and chart drill-downs navigate only to permitted modules.
- [ ] Verify read-only roles cannot mutate data through the dashboard or destination screens.
- [ ] Add tests for role-to-dashboard selection, data visibility and authorization boundaries.
- [ ] Run frontend, backend, foundation and full-system CI.
- [ ] Manually validate dashboards with representative accounts for every role family.
- [ ] Update this document and `PROGRESS.md` when each milestone is implemented and verified; do not mark unchecked items complete before evidence exists.

## Current implementation notes

Some dedicated dashboards and analytics components already exist (including System Administrator, Principal and HR/Resident Director workspaces, and role-specific secretary/receptionist/department views). Their presence does not establish complete role coverage, chart correctness, live-data completeness, or authorization correctness. These must be audited and verified against the checklist above.
