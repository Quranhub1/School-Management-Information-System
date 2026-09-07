# Remaining Finance Implementation Plan

## Workstreams
1. Persistence integrity: enforce immutability of posted journal history and append-only finance audit events.
2. Adjustment lifecycle: controlled cancellation/reversal of credit notes and refunds without mutating historical postings.
3. Dimensions: campus, faculty, department and programme on journal lines and reporting filters.
4. Reporting: production General Ledger, Trial Balance, Income Statement, Balance Sheet, cash/bank and budget-vs-actual derived from posted journals.
5. Fiscal controls: fiscal periods, period close and controlled opening balances.
6. Banking: bank accounts, bank transactions, matching and reconciliation.
7. Verification: unit, integration and persistence tests; authorization and validation; frontend/API coverage; CI on frontend, foundation and full-system workflows.

## Acceptance gate
Do not mark any workstream complete until its implementation and automated verification exist in the repository and the three required CI workflows are green.
