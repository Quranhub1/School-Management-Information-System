# Finance Roles Specification

## Overview
This document specifies the roles and responsibilities for financial management within the School Management Information System (SMIS). It defines two primary finance roles: Accountant (Senior Finance Authority) and Assistant Accountant (Finance Operations), along with their respective responsibilities, workflows, and the maker-checker control mechanism.

## 1. ACCOUNTANT — SENIOR FINANCE AUTHORITY
The Accountant is responsible for the overall financial management and control of the institution.

### Main Areas of Responsibility
- Finance Dashboard
- Student Fees & Fee Structures
- Payments & Receipts
- Revenue & Receivables
- Expenditure
- Accounts Payable
- Budget Management
- General Ledger & Journals
- Bank & Cash Management
- Procurement Finance
- Payroll
- Staff Allowances
- Financial Approvals
- Reconciliation
- Period Closing
- Financial & Audit Reports

### Staff Allowances Responsibilities
The Accountant:
- Defines/authorizes allowances
- Selects staff
- Sets allowance type and amount
- Sets effective period/frequency
- Approves changes
- Stops/cancels allowances
- Reviews allowance entries
- Feeds approved allowances into payroll

## 2. ASSISTANT ACCOUNTANT — FINANCE OPERATIONS
The Assistant Accountant handles routine financial recording and preparation.

### Main Areas of Responsibility
- Assistant Accountant Dashboard
- Student Accounts
- Fee Payments
- Payment Allocation
- Receipts
- Outstanding Fees
- Expenditure Recording
- Supplier Invoices
- Payment Requests
- Accounts Payable Processing
- Cashbook
- Bank Transactions
- Reconciliation Preparation
- Operational Finance Reports

### Staff Allowances Responsibilities
The Assistant Accountant has:
- Allowance Recording
- Recorded Allowances
- Allowance History
- Payroll Preparation

**Note:** Their responsibility is to record allowances provided/authorized by the Accountant. They do not independently authorize or create official allowances.

## 3. CORE FINANCIAL WORKFLOW

### Assistant Accountant Workflow
```
Record → Verify → Prepare → Submit
```

### Accountant Workflow
```
Review → Approve → Post → Reconcile → Report → Close
```

### Allowance Workflow (Maker-Checker Control)
```
Accountant authorizes allowance → 
Assistant Accountant records it → 
Accountant verifies → 
Approved allowance feeds into Payroll
```

This workflow establishes a clear maker-checker financial control system while maintaining the Accountant as the senior financial authority.

## 4. INTEGRATION WITH SYSTEM ADMINISTRATION
These finance roles operate within the broader Role-Based Access Control (RBAC) system managed by the System Administrator. The System Administrator:
- Creates and manages the Accountant and Assistant Accountant roles
- Assigns appropriate permissions to each role
- Oversees role assignments and permission matrices
- Ensures proper segregation of duties through permission configuration

## 5. PERMISSIONS
Specific financial permissions that would be assigned to these roles include (but are not limited to):

### Accountant Permissions
- finance.view
- finance.create
- finance.edit
- finance.delete
- finance.approve
- finance.reverse
- finance.budget_manage
- finance.payroll_manage
- finance.allowance_authorize
- finance.reconcile
- finance.period_close
- finance.reports_generate

### Assistant Accountant Permissions
- finance.view
- finance.create
- finance.edit
- finance.submit
- finance.allowance_record
- finance.payroll_prepare
- finance.reports_prepare