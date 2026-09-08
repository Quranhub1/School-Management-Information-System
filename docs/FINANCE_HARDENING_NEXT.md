# Finance Accounting Hardening — Next Implementation Gate

This gate defines the next production-completeness work after the current Finance reporting foundations.

## Required controls

- Adjustment cancellation/reversal must create a compensating, traceable accounting effect; posted history must remain immutable.
- Reversal operations must be idempotent and reject duplicate reversal attempts.
- PostgreSQL integration tests must prove posted-journal and audit-log immutability at the persistence boundary.
- Fiscal periods must control posting dates and period state (open/closed), with controlled closing and opening-balance handling.
- Accounting dimensions must be available for campus, faculty, department and programme where configured.
- General Ledger, Trial Balance and financial statements must respect fiscal period and configured dimensions.

## Acceptance gate

A finance feature is complete only when domain rules, EF Core persistence, authorization, validation, API behavior, frontend workflow (where applicable), automated tests and CI evidence are all present.

## Implementation sequence

1. Adjustment cancellation/reversal.
2. PostgreSQL persistence tests for immutability and reversal.
3. Fiscal periods and closing/opening balances.
4. Accounting dimensions and dimension-aware reports.
5. Bank transactions and reconciliation.
6. Budget vs actual.
7. Finance dashboard and end-to-end workflows.
