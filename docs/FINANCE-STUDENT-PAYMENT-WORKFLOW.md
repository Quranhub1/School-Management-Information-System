# Student fee payment workflow

## Active payment-entry route

The supported manual student-fee payment workflow is:

1. Open **Finance & Accounting**.
2. Select **Student Fees & Payments**.
3. Filter the register by programme, uptake/intake, class/year of study, semester or academic year.
4. Select the student to open their account.
5. In **Billable Items**, choose **Record Payment** on the invoice with an outstanding balance.
6. Enter the amount, receipt number, payment method and optional bank/mobile reference.
7. Post the payment and verify the refreshed invoice balance and payment history.

Payments are recorded against a specific invoice. This keeps the receipt, invoice balance and student ledger connected.

## Other finance screens

- **Collections** is for reviewing posted receipts and transactions. It is not a second payment-entry screen.
- **AccountsOverviewWorkspace** contains account summaries and payment history; it does not provide a separate student payment-posting form.
- **BulkPayments**, **AccountsOfficeManagement** and **MobileMoneyPayments** are not mounted in the active application navigation. They must not be used as live payment-entry routes.
- Mobile-money prompts/callbacks, USSD, bank API integrations, online gateways and SchoolPay are not part of the active manual workflow. Keep them separate until their integrations and reconciliation controls are completed and approved.

## Cohort register data

The student fee register is grouped using the student's actual academic records:

- Programme code and programme name (for example, CPH — Certificate in Pharmacy)
- Intake code/name (uptake)
- Year of study (class/year)
- Semester
- Academic year

Where a student has no individual academic-status record, the current semester and academic year are used for display when configured. A student's year of study falls back to the active programme enrollment's current year. Missing programme or intake links remain visibly unassigned; they are not inferred from a fee description.
