# Dropdown and Reference-Data Audit

**Audit baseline:** `main` at `2b4fcdcd98ced16c4224e6834ed03f20eeabafde` (20 November 2026)  
**Scope:** Frontend form controls and the corresponding API/domain concepts identified in the repository.  
**Status:** Static source audit; runtime database contents and every conditional/modal workflow have not yet been inspected. This document deliberately distinguishes confirmed sources from candidates requiring verification.

## Rules for reference data

1. Reuse the existing domain entity, enum, endpoint, or catalogue before adding a new lookup table.
2. Persist configurable institutional reference data in PostgreSQL and expose it through authenticated API endpoints.
3. Use stable codes/IDs, unique constraints, deterministic ordering, and explicit active/inactive state where records can be retired.
4. Never delete or silently rewrite reference rows already referenced by historical records.
5. Keep operational data (students, staff, payments, attendance events, classes, timetable sessions) out of seed migrations.
6. Seed idempotently. A migration must be safe on an existing installation containing manually created or legacy values.
7. Avoid duplicating a catalogue: programme/course selection must continue to use the existing programme and curriculum/course model; semesters must continue using existing semester records.
8. Do not seed a value solely because a frontend select contains it. First confirm its business meaning, backend validation, reporting impact, and whether it is institution-specific.

## Confirmed existing data sources / dynamic selectors

| Area / screen | Dropdown | Observed source | Audit decision |
|---|---|---|---|
| Admissions / StudentManagement | Academic authority | `academicAuthorities` API catalogue | Reuse existing authorities |
| Admissions / StudentManagement | Programme | Existing programme catalogue filtered by authority | Reuse programme catalogue; do not create a second course catalogue |
| Admissions / StudentManagement | Academic year | Academic-year catalogue | PR #438 adds the rolling YYYY-YYYY catalogue; pending merge/CI |
| Admissions / StudentManagement | Intake | Intake catalogue | PR #438 limits active choices to January and August; pending merge/CI |
| Admissions / StudentManagement | Semester | Existing semester model | Preserve existing records and links; no reseed |
| Academic Structures | Programme, academic year, period/semester, class, course | Existing programmes, years, semesters/periods, classes and courses endpoints | Dynamic reference/operational records; no static seed |
| Timetable Management | Programme, curriculum, academic period, teaching group, course unit, lecturer | Programme/curriculum/course/teaching-group/staff data | Reuse existing records; teaching groups and offerings are operational setup, not seed data |
| Attendance Workspace | Semester, programme, intake, teaching group, timetable session, student | Existing academic and attendance APIs | Dynamic; attendance status options are a separate controlled vocabulary |
| Staff Management | Department | Existing departments endpoint | Reuse existing departments |
| Campus Management | Campus, active user | Existing campus and user APIs | Operational/institutional records; do not seed fake campuses/users |
| Fee Types Manager | Academic year, revenue account | Existing academic-year and chart-of-accounts APIs | Dynamic |
| Library Management | Programme, course, semester, study year, academic year, book, member | Existing programme/curriculum/semester/student/staff/book data | Dynamic; no duplicate catalogue |
| Hostel Management | Hostel, room, bed | Existing hostel/room/bed records | Operational inventory/accommodation records; do not seed |
| SMS Communication | Programme | Existing programme API | Dynamic |
| Staff Attendance | Department | Existing departments API | Dynamic |
| Campus access assignment | Campus, active user | Existing campus/user APIs | Dynamic |

## Static or locally defined choices found in the source scan

These are candidates for a consistent vocabulary or shared constants. They are **not all candidates for database seeding**.

| Screen | Current choices | Recommended treatment |
|---|---|---|
| Student Management | Entry status: Direct/Mature | Confirm admissions policy; likely controlled vocabulary |
| Student Management | Study programme/session: Day/Evening/Weekend | Rename/clarify as study mode; preferably use the programme's existing study-mode field where applicable |
| Student Management | Gender: Female/Male/Prefer not to say | Shared controlled vocabulary; confirm accepted values and privacy/reporting requirements |
| Student Management | Serious condition / regular medication: Yes/No | Boolean fields, not lookup tables; review whether the form should collect these sensitive details |
| Student Management | Guardian relationship: Parent/Mother/Father/Guardian/Sponsor/Other | Shared relationship vocabulary; avoid duplicated variants (Parent vs Mother/Father) without a clear model |
| Admissions Management | Admission status list | Reuse the existing admission/application status domain and server transition rules; do not create a second status table |
| Admissions Student Management | Indexing: Not Indexed/Pending/Indexed/Rejected | Confirm whether this is a regulatory workflow status; centralize with backend enum/validation |
| Admissions Student Management | Student status list | Reuse existing student academic/lifecycle status |
| Staff Management | Staff category: Teaching/Non-teaching | Existing `StaffType` backend enum; PR #440 centralizes frontend values and labels |
| Staff Management | Employment type: Permanent/Temporary/Part-time | Candidate reference data if institution-configurable; otherwise shared enum |
| Staff Management | Leave type: Annual/Sick/Maternity/Paternity/Study | Existing `LeaveType` backend enum; PR #440 shares the frontend options and API validation. Do not create a lookup table or seed rows |
| Staff Management | Payroll month: January–December | Date/month utility, not reference data |
| Attendance Management | Present/Absent/Late/Excused | Existing attendance status domain exists; ensure UI and API use the same enum/allowed transitions |
| Academic Structures | Class status: Active/Closed/Cancelled | Reuse existing class status/domain rules |
| Curriculum Management | Award: Certificate/Diploma/Advanced Diploma/National Certificate/National Technician Diploma/Short Course/Vocational Award | Align with existing programme award metadata; do not add an unrelated award table until domain shape is checked |
| Curriculum Management | Duration unit: Years/Months/Weeks | Small shared enum/constant; not necessarily DB-backed |
| Curriculum Management | Programme type: Full programme/Short course | Reuse programme type field/enum |
| Curriculum Management | Study mode: Full-time/Part-time/Evening/Weekend/Distance | Align with programme study-mode metadata; avoid duplicate vocabularies |
| Curriculum Management | Delivery type: Academic/CompetencyBased/Modular/Blended | Align with programme delivery metadata |
| Curriculum Management | Approval status: NeedsVerification/ListedForReview/Institutional/Verified/Approved/ReferenceOnly | Reuse existing programme approval workflow/status |
| Curriculum Management | Course unit type: Lecture/Practical/Tutorial/Seminar/Laboratory/Examination/etc. | Shared course/session type vocabulary; align with timetable and curriculum validation |
| Timetable Management | Session type: Lecture/Practical/Tutorial/Seminar/Examination/Other | Must share the same vocabulary as curriculum/course-unit types where semantics match |
| Fee Structures Management | Tuition/Functional/Guild/Debt/Requirements/Placement Fee/Total Fees | High-priority finance review. Reconcile with existing FeeItem/FeeStructureItem and accounting rules; do not seed duplicate fee types or auto-post financial entries |
| Notices | Priority: General/Important/Urgent | Shared notice-priority enum/constant |
| Notices | Audience: All/Role/Department | Workflow discriminator; role and department choices should be sourced from existing APIs |
| Gate Log | Person type: Student/Staff/Visitor | Shared person-category vocabulary |
| Gate Pass Management | Regular/Medical/Emergency | Shared gate-pass type vocabulary |
| Calendar reminders | Recipient: All/Student/Staff | Shared recipient scope; dynamic audience targeting |
| Calendar reminders | Channel: In-App/SMS/Email | Use configured/available notification channels; never offer an unconfigured channel as if operational |
| Alumni Management | Council: UHPAB/NCHE | Review authority catalogue; likely link to existing academic authorities/regulators rather than duplicate names |
| Alumni Management | Licence status: Not Registered/Pending/Registered/Expired | Controlled professional-registration status |
| Alumni Management | Exam body: UNMEB/UAHEB/Other | Link to existing examination/authority catalogue where appropriate |
| Alumni Management | Exam result: Pass/Fail/Pending | Shared result status vocabulary |
| Alumni Management | Clearance: Pending/Cleared/Blocked | Shared clearance workflow state |
| Alumni Management | Request type: Official Transcript/Certificate/Letter of Good Standing | Document-request catalogue or enum, depending on workflow |
| Health Records | Record type: Clinic Visit/Emergency/Follow-up/Vaccination | Controlled clinical-record category; review privacy and role permissions before expanding |
| Welfare Inventory | Movement: Consumption/Receipt/Wastage/Adjustment | Existing stock transaction type/domain; shared labels and server validation |
| Staff Allowances | Allowance type | Existing `ALLOWANCE_TYPES` frontend constant; verify backend validation and policy before centralizing |
| Staff Allowances | Frequency: Monthly/One-time/Weekly/Daily | Shared payroll frequency vocabulary |
| Library Management | Member type: Student/Staff | Reuse person/staff/student domain categories |
| Library Management | Payment status | Reuse library payment/clearance workflow status |
| Notices / SMS | Recipient types and roles | Roles should come from existing role catalogue; do not hardcode a parallel role list |
| Printer Management | Document type: Certificate/Report Card/Receipt/Transcript/Custom | Application capability list; not general reference data |
| Printer Management | Paper: A4/A3/Letter; orientation: Portrait/Landscape | Presentation/printing standards; constants, not DB seeds |
| Certificate Management | Award type: Certificate/Diploma/Degree/Postgraduate Diploma/Masters | Align with programme award model and actual institutional awards |
| Document Management | Document types | Existing `DOCUMENT_TYPES` constant; inspect backend document validation before any migration |
| SMS Communication | Message templates | Template content/configuration, not dropdown reference records |
| Language Toggle | Supported locales | Application-supported locales; not institution reference data |
| Printer Management | Printer list | Device discovery/configuration, not seeded records |

## Areas needing a deeper backend/data check before migrations

1. **Leave types:** `SchoolManagement.Domain/Staff/LeaveType.cs` defines a C# enum (`Annual`, `Sick`, `Maternity`, `Paternity`, `Study`), not a database entity. PR #440 centralizes the frontend values and Zod API validation. Do not create a lookup table or seed rows unless the product requirement explicitly changes to institution-configurable leave categories.
2. **Departments/faculties/campuses:** domain entities and APIs exist. They are institution-specific setup records, so do not invent departments/campuses without an approved KSHS structure.
3. **Attendance and admission statuses:** domain status types already exist. Ensure frontend options match backend enums and state-transition rules; avoid lookup-table duplication. Attendance status values are `Present`, `Absent`, `Late`, and `Excused`.
4. **Programme metadata:** award, study mode, delivery type and approval status are already programme fields/metadata in the curriculum catalogue. Align UI choices with that model.
5. **Finance fee categories:** reconcile current UI values against FeeItem/FeeStructureItem, invoice-line and chart-of-accounts behavior before adding any values. A bad seed can affect receivables and revenue posting.
6. **Inventory movement types:** inspect WelfareStockTransaction and inventory-register APIs. Keep stock movement types constrained and auditable.
7. **Professional/exam authorities:** use the existing AcademicAuthority/assessment authority catalogues where the relationship is semantically correct; do not mix regulators, exam bodies and programme sources indiscriminately.

## Known gaps and technical risks

- Some forms embed literals directly in JSX, while similar concepts are represented by backend enums or database entities. This risks label drift and invalid API values.
- Similar concepts are named differently across screens (e.g. curriculum course-unit type vs timetable session type; student status vs admission status). A shared vocabulary map is needed, but only where meanings truly match.
- Dynamic dropdowns must expose loading, empty, error and inactive states. A blank list must not be silently interpreted as “no records exist” when an API call failed.
- All selectors should use stable IDs/codes as values, not display labels, except where the API contract explicitly requires a code.
- The frontend must not independently invent new choices for server-enforced workflows.
- The static scan covers key operational screens and form components, but not every conditional modal, nested subcomponent, or all API payloads. A second pass should use the complete component tree and compare each selector to its controller/DTO.
- Runtime row counts and actual production/local database contents were not available to this static audit. Before any seed migration, inspect the target database and existing migration history.

## Recommended implementation sequence

### Phase A — Finish existing academic catalogue work
- Complete CI for PR #438, fix failures, and merge only when all required checks pass.
- Verify the migration against a copy of an existing database with legacy academic years, semesters, and intake records.
- Confirm that January/August are the only open intake options and historical intake rows remain intact.
- Confirm that existing semester IDs and relationships remain unchanged.
- Verify academic-year dropdown sorting and rolling extension.

### Phase B — Normalize existing vocabularies (no new reference tables yet)
- [x] Extract shared TypeScript values/options for staff type and leave type.
- [x] Reuse leave-type values in API validation instead of maintaining a second list.
- [x] Add tests proving the dropdown options and API validation accept the same leave values and preserve the backend staff-type values.
- [ ] Continue the same audit for attendance, admissions, gate-pass, notice priority, and other controlled vocabularies.
- [ ] Remove duplicate lists and hardcoded roles only after confirming their API contracts and authorization sources.
- Keep user-configurable data in the database, not in shared constants.

**Implementation:** [PR #440 — Centralize frontend options for backend enum contracts](https://github.com/Quranhub1/School-Management-Information-System/pull/440) (open; CI pending at time of update).

### Phase C — Seed only approved missing reference records
- Inspect current database and migrations for each candidate.
- Agree canonical codes, labels, sort order, active state, and whether the list is institution-specific.
- Add idempotent migrations with uniqueness and safe legacy reconciliation.
- Add API endpoints and authorization only where missing.
- Add integration tests for existing populated databases and empty databases.

### Phase D — Reference-data administration
- Add a compact Settings workspace for approved configurable lists.
- Support add/edit/deactivate/reorder with permission checks and audit logging.
- Prevent deletion of values referenced by historical records.
- Make every consumer use the same API/catalogue.

## Explicitly out of scope for seeding

Do not seed sample students, staff, users, parents, campuses, departments, hostels, rooms, beds, books, vendors, payments, fee structures, course offerings, teaching groups, timetable sessions, attendance records, or examination results. These are real operational or institution-specific records and must be entered/imported through their proper workflows.
