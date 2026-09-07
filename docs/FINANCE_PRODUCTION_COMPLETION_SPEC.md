# Finance Production Completion Specification

This document defines the remaining production scope tracked by issue #96. It is an implementation contract, not a claim that a feature is complete merely because a model or endpoint exists.

## 1. Ledger integrity
- Posted journal entries and posted journal lines are immutable at the persistence boundary.
- Corrections occur only through controlled reversals.
- Database constraints/triggers or equivalent persistence interception prevent UPDATE/DELETE of posted ledger history.
- Every posting, reversal and failed mutation is traceable to actor, timestamp, source document and reason where applicable.

## 2. Finance audit events
- Append-only finance audit events record posting, reversal, cancellation, credit-note, refund, allocation and reconciliation actions.
- Audit events cannot be modified or deleted by ordinary application workflows.
- Tests prove append-only behavior.

## 3. Adjustments
- Credit notes/refunds can be cancelled only through a controlled compensating transaction.
- Original documents and journal effects remain preserved.
- Cancellation requires authorization, reason and actor metadata.

## 4. Accounting dimensions
- Journal lines may carry campus, faculty, department and programme dimensions.
- Dimensions are optional where the transaction is institution-wide but validated when required by an account/reporting policy.
- General ledger and financial statements can filter/group by dimensions.

## 5. Financial reporting
Implement reconciled, date-range-aware reports for:
- General Ledger
- Trial Balance
- Income Statement / Profit & Loss
- Balance Sheet
- Cash and bank summary
- Budget versus actual
- Student receivables ageing

Reports must derive from posted journals rather than duplicated balances.

## 6. Fiscal periods and opening balances
- Fiscal periods have open/closed state.
- Posting into a closed period is rejected.
- Closing is authorized and auditable.
- Opening balances are represented as controlled journal entries.

## 7. Banking
- Bank accounts and bank transactions are recorded independently of ledger entries.
- Transactions can be matched to ledger postings.
- Reconciliation records statement date/balance, matched items, outstanding items and completion actor/time.
- Reconciliation differences are explicit; no silent balance manipulation.

## 8. Definition of done
A feature is complete only when domain/application behavior, persistence, authorization, validation, API/UI integration where applicable, automated tests and CI verification are present. No placeholder-only implementation qualifies.
