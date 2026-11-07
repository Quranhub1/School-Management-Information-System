# KSHS SMIS — Meeting Requirements and Developer Implementation Specification

**Source:** KSHS departmental requirements meeting transcript, 7 November 2026  
**Repository:** `Quranhub1/School-Management-Information-System`  
**Status:** Requirements and implementation-planning document  
**Currency:** UGX  
**Important:** This document records proposed requirements. It does not certify that the features are complete, deployed, or accepted by KSHS.

## 1. Purpose and guiding principles

This specification translates the requirements raised by school representatives into a development and verification plan for the School Management Information System (SMIS).

The central requirement is an integrated system in which departments use shared, authoritative institutional records while each user is restricted to the information and actions permitted by their role.

Development should extend the existing SMIS architecture rather than create duplicate modules, databases, student identities, or staff identities.

Guiding principles:

1. One authoritative student record shared by authorised departments.
2. One authoritative staff record shared by HR and Finance.
3. Role-based access enforced by the backend, not merely by hiding frontend navigation.
4. Clear separation between viewing, creating, editing, approving, reversing, and deleting.
5. Auditable financial and administrative transactions.
6. Integration and offline-capable core operations designed around the school's approved infrastructure.
7. Requirements and acceptance evidence must be distinguished from repository implementation notes.

## 2. Existing repository foundation and verification caveat

The repository progress tracker dated 11 October 2026 documents an existing .NET 8, EF Core and PostgreSQL backend, a React/TypeScript/Vite frontend, identity and authorization infrastructure, and domain areas covering admissions, academics, assessment, attendance, examinations, finance, staff and students. It also records inventory threshold work and role-specific dashboard work, with verification tasks still outstanding.

These entries are repository-reported development status, not proof of successful operation in KSHS's production environment. Before changing code, audit the current default branch and verify the actual frontend routes, API endpoints, database schema, migrations, authorization policies and tests.

Do not create replacement modules where an existing implementation can be safely extended.

## 3. Finance management

### 3.1 Requirements

The Finance module should support:

- Separate fee categories, including tuition, guild fees and other school-approved charges.
- Student-level financial profiles showing charges, payments, allocations and outstanding balances.
- Authorised configuration of fee categories.
- Clear fully paid, partially paid and outstanding statuses.
- Daily, semester-based and annual collection reports.
- Outstanding-fees and receivables reports.
- Financial summaries and charts by fee category and reporting period.
- Auditable corrections, reversals and adjustments.
- SchoolPay integration, subject to the provider's supported API and institutional agreement.

### 3.2 Student financial statement

The student account should show, at minimum:

| Fee category | Amount charged | Amount paid | Balance |
|---|---:|---:|---:|
| Tuition | UGX 1,000,000 | UGX 700,000 | UGX 300,000 |
| Guild | UGX 50,000 | UGX 50,000 | UGX 0 |
| Other approved fee | UGX 100,000 | UGX 0 | UGX 100,000 |

*Illustrative figures only; they are not actual KSHS student financial data.*

Tuition, guild and other fee balances must remain distinguishable. Payments must be allocated to the correct student invoice and fee category; the system must not treat all receipts as tuition.

### 3.3 SchoolPay integration workflow

1. Finance creates or identifies the student's payable invoice.
2. The student pays through an approved SchoolPay channel.
3. The provider communicates payment confirmation through its supported integration mechanism.
4. The SMIS backend validates the reference, amount, status and relevant student/invoice mapping.
5. The payment is recorded and allocated to the appropriate account.
6. The student balance and relevant reports are recalculated.
7. Pending, failed, unmatched and successfully reconciled transactions are visible to authorised Finance users.

The integration must be idempotent: duplicate provider notifications must not create duplicate financial postings. Credentials and signing secrets must remain server-side. Confirm SchoolPay API access, authentication, callback/webhook format, reference rules, test environment and reconciliation capabilities before implementation.

### 3.4 Suggested finance work items

| ID | Work item |
|---|---|
| FIN-01 | Verify fee structure and invoice support for distinct fee categories. |
| FIN-02 | Implement or complete student financial statement view. |
| FIN-03 | Provide authorised fee-category configuration. |
| FIN-04 | Verify payment allocation and balance calculations. |
| FIN-05 | Implement SchoolPay provider adapter and secure notification handling. |
| FIN-06 | Add daily, semester and annual collection reporting. |
| FIN-07 | Add outstanding balances and receivables reporting. |
| FIN-08 | Verify audit trail, adjustments and reversals. |

## 4. Human Resource and payroll coordination

### 4.1 HR requirements

HR should manage teaching and non-teaching staff records and support:

- Staff contracts, contract periods, terms and attachments.
- Academic and professional qualifications.
- Competencies, skills and professional specialities.
- Staff training and professional development history.
- Recruitment, vacancies and job advertisements.
- Applications, interview schedules, interview panels and outcomes.
- Performance appraisals.
- Staff attendance.
- Leave applications, approvals, balances and history.
- Promotions and authorised position changes.

### 4.2 HR and Finance boundary

Payroll should remain a Finance responsibility. HR should maintain authoritative employment information and provide the approved staff data needed for payroll.

- HR manages contracts, employment status, qualifications, position changes, leave and relevant attendance information.
- Finance manages payroll calculations, approvals, payment processing and payroll reports.
- Access to salary and other sensitive employment information must be restricted.
- Changes affecting payroll must be authorised and auditable.

### 4.3 Suggested HR work items

| ID | Work item |
|---|---|
| HR-01 | Complete contract records, attachments and renewal reminders. |
| HR-02 | Complete qualifications, competencies and specialities. |
| HR-03 | Add training and development history. |
| HR-04 | Complete vacancies, recruitment and job advertisement workflows. |
| HR-05 | Add interview scheduling, panels and outcomes. |
| HR-06 | Add appraisal records and review periods. |
| HR-07 | Verify staff attendance workflows. |
| HR-08 | Complete leave approvals and balances. |
| HR-09 | Add authorised promotion and position-change history. |
| HR-10 | Verify the controlled HR-to-Finance payroll handoff. |

## 5. Inventory and institutional assets

The meeting requires departmental inventory management. The repository progress tracker dated 11 October 2026 reports per-item low-stock thresholds and in-app warnings for Records Officer and School Warden dashboards, while also listing verification work as outstanding. Verify the current implementation before extending it.

### 5.1 Required registers

- ICT Skills Lab
- DCM Lab
- Pharmacy Lab
- CLT Lab
- Food Science Lab
- Biomedical Engineering Lab
- Admin Block
- Furniture
- Sports
- Guild
- Kitchen
- Sickbay
- Infrastructure

### 5.2 Register fields

| Field | Purpose |
|---|---|
| Serial number | Register identification |
| Item name | Item description/name |
| Description | Specifications or details |
| Quantity | Current stock quantity |
| Condition | Good, damaged, repairable or unusable |
| Location | Physical location |
| Department | Responsible department |
| Minimum stock threshold | Configurable alert level |

### 5.3 Required functionality

- Register stock and durable assets.
- Record receipts, issues, transfers and adjustments.
- Maintain current quantities and movement history.
- Record condition, custody and location.
- Support stock shortage and zero-stock alerts.
- Record maintenance and disposal for durable assets.
- Produce departmental inventory reports.
- Require appropriate approval for purchases, adjustments and disposals.
- Preserve audit history.

Consumable stock and durable assets should be modelled appropriately: consumables need quantity movements and balances; durable assets need individual identification, custody, condition and maintenance history.

A blank threshold should follow the documented project rule only if confirmed in the current implementation: warn when stock reaches zero. Confirm the exact threshold behaviour with management. Alerts should reach the authorised Records Officer and School Warden.

## 6. Role-based dashboards and access control

The meeting requires one login experience with role-appropriate dashboards and restricted access.

Proposed role boundaries, subject to management approval:

| Role | Proposed access boundary |
|---|---|
| System Administrator | System configuration and authorised institutional administration. |
| Principal | Institutional oversight and read-only financial access. |
| Deputy Principal | Principal-level operational oversight, excluding restricted command execution. |
| Academic Registrar | Academic administration and authorised academic records. |
| Assistant Academic Registrar | Assigned academic administration. |
| Accountant | Financial transactions, balances, reconciliation and reports. |
| Assistant Accountant | Assigned Finance functions. |
| HR Manager | Staff, contracts, recruitment, leave and appraisal records. |
| Receptionist | Admissions, requirements and student information needed for reception duties. |
| Records Officer | Authorised student records, staff records and inventory operations. |
| School Warden | Assigned inventory operations and stock alerts. |
| Departmental Head | Information and operations for the assigned department. |
| Librarian | Library operations and member records. |

### 6.1 Security requirements

- Enforce authorization in backend endpoints and services.
- Separate read, create, edit, approve, reverse and delete permissions.
- Apply least-privilege access.
- Restrict sensitive student, staff and financial information.
- Record sensitive actions in an audit log.
- Prevent users from granting themselves privileges.
- Test both permitted and denied access using representative role accounts.

The Principal's read-only Finance access must be an explicit acceptance test: the Principal may view approved financial information but must not post, edit, reverse or delete transactions.

## 7. Academic management

The repository documents academic structure, programmes, course registration, assessments, attendance, examinations, progression and timetable services. Verify current functionality and complete the workflows requested by the school.

Required capabilities:

- Programme and course-unit management.
- Student allocation to programmes, intakes and classes.
- Course registration.
- Assessment plans, marks and weighting.
- Result calculations, approvals and publication.
- Class lists and class population reports.
- Class-specific timetable generation and clash detection.
- Timetable printing and downloading.
- Transcript generation and request tracking.
- Academic calendars, semesters and start dates.
- Academic progression and standing.

Transcript clearance rules must be confirmed with Academic and Finance management. Do not assume a financial restriction or introduce one without an approved school policy.

## 8. Central student information and admissions lifecycle

The system should maintain one authoritative student identity shared by authorised departments.

Target workflow:

1. Reception creates an applicant record.
2. Admissions reviews the application and required documents.
3. An authorised officer records the admission decision.
4. An accepted applicant is converted into one student record.
5. Academics creates or links the student's enrolment.
6. Finance creates the relevant invoices and fee obligations.
7. Other authorised departments access the same student identity.

The repository progress tracker reports admission decision synchronization, duplicate-admission prevention and student/enrolment reuse as completed development items. Verify these against current code and end-to-end tests before relying on them.

**Non-negotiable rule:** A department must not create a second student identity merely because it needs departmental information.

## 9. Admission validation and document control

Required enhancements:

- Define mandatory admission fields.
- Define document requirements by programme or intake where applicable.
- Display missing documents and incomplete information.
- Block final submission when mandatory information is missing.
- Prevent printing or finalising documents before required checks pass where school policy requires it.
- Record reviewers, approvers, decisions and timestamps.
- Preserve decision history.
- Explain precisely which information is missing when validation fails.

The exact mandatory fields, documents and printing restrictions must be approved by the relevant KSHS office.

## 10. Notifications and reminders

The repository contains calendar, notice, communication and notification domain concepts. Confirm their current implementation before extending them.

Required notification use cases include:

- Upcoming institutional events.
- Academic calendar reminders.
- Contract expiry reminders.
- Interview schedules.
- Leave approvals and pending actions.
- Low-stock alerts.
- Pending academic approvals.
- Payment and reconciliation exceptions.

Start with in-app notifications so core operations do not depend on internet access. Email or SMS may be added as optional channels after the school confirms requirements, providers and costs.

## 11. Data relationships and integrity

The following relationships should be preserved or established in the existing data model:

| Authoritative record | Related records |
|---|---|
| Student | Applicant, admission, enrolment, programme, invoices, payments, attendance, assessments, transcripts and guardian details |
| Staff member | Contract, qualifications, competencies, training, attendance, leave, appraisal and payroll |
| Financial account | Fee categories, invoices, payments, allocations, ledger entries and reconciliation |
| Inventory item/asset | Register, department, location, stock movements, condition, threshold and maintenance |
| User account | Role, permissions, department and audit history |
| Calendar event | Responsible department, recipients and reminders |

Database integrity rules:

1. Use stable database identifiers for relationships.
2. Do not identify students or staff by name alone.
3. Avoid duplicate student and staff profiles across modules.
4. Preserve historical financial transactions.
5. Use database transactions for multi-record operations.
6. Make external payment notifications safe against duplicate processing.
7. Record who performed sensitive changes and when.

## 12. API and frontend implementation map

This is a planning map, not confirmation that every endpoint or screen is complete.

| Area | Repository foundation to inspect | Work to verify or implement |
|---|---|---|
| Admissions | Admissions API and services | Document checklist, validation, decision workflow and conversion tests |
| Students | Student API and services | Shared student profile and departmental access |
| Finance | Finance API and services | Fee category reporting, balances, ledger and reconciliation |
| SchoolPay | No confirmed provider integration in the reviewed progress notes | Provider adapter, secure notifications and reconciliation |
| HR | Staff API and HR services | Contracts, competencies, training, recruitment, interviews and appraisals |
| Payroll | Staff/payroll services | HR-to-Finance handoff and approval controls |
| Academics | Academic structure and programme services | Student allocation, course units and class lists |
| Assessments | Assessment and examination services | Calculations, approval and publication |
| Timetables | Timetable workflow/API | Class-specific generation, clash detection, print and download |
| Inventory | Inventory screens and threshold work | Stock movement, register controls, permissions and audit history |
| Calendar | Calendar services | Event reminders and departmental notifications |
| Communications | Notices, messages and notifications | Reusable in-app notification delivery |
| Reporting | Reporting APIs and services | Departmental reports, exports and reconciled figures |
| Access | Identity and authorization policies | Role-by-role permission tests |

## 13. Recommended implementation sequence

### Phase 1 — Audit and baseline

- Inspect the current default branch.
- Map frontend routes, API endpoints, services, database entities and migrations.
- Review role and permission definitions.
- Run existing automated tests.
- Produce an evidence-based gap list: working, incomplete, missing, and unverified.
- Do not change code until the baseline and affected dependencies are understood.

### Phase 2 — Central student and staff records

- Verify that Admissions, Academics and Finance reference the same student identity.
- Verify that HR and Payroll reference the same staff identity.
- Correct duplication and lifecycle issues without discarding historical records.

### Phase 3 — Finance and SchoolPay

- Complete fee categories and student financial statements.
- Verify payment allocation, balances, ledger and reports.
- Confirm SchoolPay technical access and integration contract.
- Implement secure, idempotent payment notification and reconciliation.

### Phase 4 — HR and payroll coordination

- Complete contracts, recruitment, interviews, competencies, training, appraisals, attendance and leave.
- Establish authorised HR-to-Finance data handoff.

### Phase 5 — Inventory and accountability

- Verify registers, stock movements, asset custody, approvals and alerts.
- Test thresholds, including zero-stock behaviour.

### Phase 6 — Academics and admissions controls

- Complete class allocation, course units, assessments, results, transcripts and timetable workflows.
- Complete mandatory admission validation and document controls.

### Phase 7 — Permissions and notifications

- Verify every role's dashboard, permitted actions and restrictions.
- Implement and test relevant in-app reminders.

### Phase 8 — Reporting and acceptance testing

- Exercise complete school workflows.
- Reconcile report totals with underlying records.
- Complete deployment, backup/restore, security and user acceptance tests.

## 14. Acceptance test matrix

Screens merely loading is not sufficient. Test complete workflows with representative accounts and a dedicated test database.

| Test ID | Scenario | Expected result |
|---|---|---|
| AT-01 | Reception admits a new student | One student identity is created and reused by other departments. |
| AT-02 | Finance opens the student's account | Correct tuition, guild fees, payments and outstanding balances appear. |
| AT-03 | SchoolPay sends the same confirmation twice | Only one financial transaction is posted. |
| AT-04 | Principal opens Finance | Financial information is visible; posting and editing are denied. |
| AT-05 | Receptionist opens a restricted Finance endpoint | Backend denies access. |
| AT-06 | HR records an approved staff promotion | Employment record is updated and the change is auditable. |
| AT-07 | Finance prepares payroll | Appropriate approved staff information is available. |
| AT-08 | Inventory reaches its configured threshold | Relevant Records Officer and School Warden receive alerts. |
| AT-09 | Admission lacks a mandatory document | System identifies the missing document and blocks the applicable finalisation step. |
| AT-10 | Academic Registrar generates a class list | List reflects actual student enrolments. |
| AT-11 | Timetable contains a conflicting allocation | System detects and reports the clash. |
| AT-12 | An event is scheduled | Relevant users receive the configured advance reminder. |
| AT-13 | An authorised user changes a sensitive record | Audit history records the actor, action and time. |
| AT-14 | Public internet is unavailable | Core LAN-hosted operations remain usable if offline/LAN operation is part of the approved deployment design. |

## 15. Management decisions still required

The meeting raised requirements that need further policy or provider detail before implementation:

| Topic | Decision or information required |
|---|---|
| SchoolPay | API access, authentication, callbacks/webhooks, payment references, test environment and reconciliation capabilities |
| Fee categories | Who may create, edit or deactivate fee categories; whether approval is required |
| Payroll | Exact division of responsibilities and approval stages between HR and Finance |
| Staff attendance | Manual, QR, biometric or combined method |
| Student privacy | Sensitive records and the specific offices permitted to access them |
| Inventory | Approval authority for purchases, stock issues, adjustments and disposals |
| Notifications | Whether in-app notifications are sufficient initially or SMS/email is required |
| Transcript clearance | Approved academic and financial conditions, if any |
| Admission documents | Mandatory fields/documents by programme and intake, and rules for printing/finalisation |

## 16. First five developer priorities

1. Audit the central student record and verify that admissions, academic enrolment and finance use the same student ID.
2. Audit Finance for separate tuition and guild fee categories, student balances, payment allocation and reliable reports.
3. Confirm SchoolPay integration requirements and design the provider adapter around the existing finance ledger.
4. Complete HR employment workflows and the controlled HR-to-Finance payroll handoff.
5. Verify role permissions individually, especially Principal, Accountant, Receptionist, HR Manager, Academic Registrar, Records Officer and School Warden.

## 17. Definition of completion

A requirement should only be marked complete when:

- The approved workflow exists in the backend and frontend.
- Authorization is enforced by the backend.
- Data is persisted correctly and relationships remain valid.
- Validation and error states are understandable.
- Audit requirements are met.
- Automated tests cover critical cases.
- Representative role accounts pass end-to-end acceptance tests.
- Reports reconcile with source records.
- Operational documentation and user training are available where required.

## 18. Overall recommendation

The meeting does not call for a completely new SMIS. It calls for deeper integration of the existing project: reliable departmental workflows, centralised student and staff information, financial accountability, inventory control and strict access permissions.

The architectural priority is one authoritative student record and one authoritative staff record, with departmental information linked to them rather than duplicated.

---

**Source basis:** KSHS departmental requirements meeting transcript dated 7 November 2026, together with the repository progress information dated 11 October 2026. Meeting-derived requirements are distinguished from repository-reported implementation status. Items not specified by the meeting are identified as decisions requiring management confirmation.
