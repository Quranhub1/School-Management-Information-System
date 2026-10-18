# OSRS Business Workflow Analysis

This document documents observed workflows and state transitions based on direct examination of the OSRS system interfaces. No transactions were submitted to test workflows; all observations are based on UI patterns and navigation structures.

---

## Workflow 1: Student Record Management

### Overview
Complete lifecycle management of student records from creation through academic progression.

### Prerequisites
- Authenticated session with student management permissions
- Institution context pre-selected (KAMPALA SCHOOL OF HEALTH SCIENCES)
- Academic program data configured in system
- District/country master data available

### Workflow Steps

#### Step 1: Student Creation
- **Entry Point**: `/admin/students` → "Create" button (inferred from patterns)
- **Form Fields**:
  - Personal Details: Full Name, Gender, Date of Birth
  - Contact: Telephone, Email, Location, District, Country
  - Identification: Identifier, HTIN (Health Trainee Identification Number)
  - Program: Applied Program selection
  - Media: Avatar/Profile Photo upload
- **Validation**: Required field validation, email format, date validity
- **State Transition**: New → Active (upon successful save)

#### Step 2: Student Record Viewing
- **Entry Point**: `/admin/students` → Row selection → "Details" action
- **View Modes**:
  - List view: Summary data in table
  - Detail view: Complete profile via modal or dedicated page
  - Academic profile: `/admin/students/{id}/academic-profile`
- **Data Display**: All fields from creation plus metadata (created/updated timestamps)

#### Step 3: Student Record Editing
- **Entry Point**: Row action dropdown → "Edit"
- **Editable Fields**: All personal, contact, and identification fields
- **Restrictions**: 
  - Program changes may require re-validation
  - HTIN changes may trigger regulatory checks
  - Photo updates via "Sync Picture (Legacy/API)" action
- **Confirmation**: Standard save confirmation with validation

#### Step 4: Student Record Deletion
- **Entry Point**: Row action dropdown → "Remove"
- **Confirmation**: "Are you sure, you want to remove this student record."
- **Confirmation Dialog**: Modal with Cancel/Confirm buttons
- **State Transition**: Active → Deleted (soft delete inferred)
- **Audit Trail**: Likely maintained in system logs

### State Transitions
```
New Student → Active → [Archived|Deleted]
Active → Academic Profile Updated → Active
Active → HTIN Assigned → Active (HTIN field populated)
Active → Graduated → Alumni (inferred)
```

### Validation Rules
- Email must be unique within institution
- HTIN must follow regulatory format (inferred)
- Date of Birth must be valid past date
- Telephone must follow Ugandan format (inferred)
- Program must exist in configured programs

---

## Workflow 2: HTIN Registration Application

### Overview
Process for applying for Health Trainee Identification Numbers for student cohorts.

### Prerequisites
- Authenticated session with registration permissions
- Students enrolled in programs
- HTIN registration period open (configured period)
- Institution configured in system

### Workflow Steps

#### Step 1: Application Preparation
- **Entry Point**: `/admin/registrations/htin/applications/list`
- **Context**: Current period selected (e.g., July 2026)
- **Data Shown**: Applications by program with pending counts
- **Example Data Observed**:
  - Certificate in Midwifery: 39 pending
  - Certificate in Nursing: 131 pending
  - Certificate In Pharmacy: 88 pending
  - Diploma In Clinical Medicine And Community Health: 37 pending

#### Step 2: Application Creation
- **Entry Point**: "New HTIN Applications" button
- **Modal Form Fields**:
  - Institution (pre-selected)
  - HTIN Registration Period (pre-selected)
  - Program (dependent dropdown)
- **Dependency Chain**: Institution → Period → Program
- **Validation**: All fields required, valid combinations only
- **Action**: "Register for HTINs" submit button

#### Step 3: Application Review
- **Entry Point**: Row → "Details" action
- **Navigation**: `/admin/registrations/htin/applications/details?...`
- **Review Criteria**: Student eligibility, program compliance, document verification
- **Outcome**: Approved → Registration; Rejected → Return for correction

#### Step 4: Registration Processing
- **Entry Point**: `/admin/registration/htin`
- **Filter Options**: Status (Pending/Approved/Rejected/All)
- **State Transitions**: Pending → Approved/Rejected
- **Counts Tracked**: Registrations count, Pending count, Approved count, Rejected count

### State Transitions
```
Application Created → Pending
Pending → Approved (becomes Registration)
Pending → Rejected (requires correction and resubmission)
Approved → HTIN Number Assigned
Rejected → Corrected → Resubmitted → Pending
```

### Validation Rules
- Institution must match authenticated user's context
- Program must belong to institution
- Period must be open for applications
- Student must be enrolled in selected program
- Duplicate applications prevented (inferred)

---

## Workflow 3: HTIN Registration Tracking

### Overview
Monitoring and managing HTIN registrations through approval lifecycle.

### Prerequisites
- HTIN applications submitted
- Registration period active
- Review permissions granted

### Workflow Steps

#### Step 1: View Pending Registrations
- **Entry Point**: `/admin/registration/htin`
- **Default Filter**: Status = Pending
- **Data Summary Observed (July 2026)**:
  - All 7 programs show pending registrations
  - Range: 2 to 131 pending per program
  - Total: 275+ pending registrations

#### Step 2: Review Individual Registration
- **Entry Point**: Row → "Details"
- **Review Criteria**: 
  - Student eligibility verification
  - Document authenticity
  - Program compliance
- **Actions**: Approve or Reject

#### Step 3: Approval/Rejection
- **State Change**: Pending → Approved OR Pending → Rejected
- **Counts Updated**: Approved count / Rejected count incremented
- **Notification**: Likely triggered to student/institution

### State Transitions
```
Registration Created → Pending
Pending → Approved (HTIN activated)
Pending → Rejected (may be appealed or resubmitted)
```

### Approval Boundaries
- Authorization required for approval actions
- Batch approval possible (inferred from table structure)
- Audit trail maintained for all decisions

---

## Workflow 4: Student Academic Profile

### Overview
Tracking academic progress and achievements for individual students.

### Prerequisites
- Student record exists
- Academic records configured
- Examinations/results data available

### Workflow Steps

#### Step 1: Access Academic Profile
- **Entry Point**: `/admin/students` → Row → "Academic Profile"
- **URL**: `/admin/students/{id}/academic-profile`
- **Data Displayed**:
  - Enrollment history
  - Program progression
  - Course registrations
  - Examination results
  - Certifications achieved
  - HTIN status
  - Academic standing

#### Step 2: Record Updates
- **Entry Point**: Academic Profile → Edit (inferred)
- **Editable Fields**:
  - Course enrollments
  - Grade updates
  - Status changes (Active, On Clinical Attachment, etc.)
  - HTIN number updates
  - Legacy registration numbers

#### Step 3: Status Management
- **Status Values** (observed in system):
  - Active
  - On Clinical Attachment
  - Retake/Repeat Year
  - Discontinued
  - Deferred
  - Graduated

### State Transitions
```
Enrolled → Active
Active → On Clinical Attachment
Active → Retake/Repeat Year
Active → Discontinued
Active → Deferred
Active → Graduated → Alumni
```

---

## Workflow 5: Staff & Examiner Management

### Overview
Management of institutional personnel including academic staff and examiners.

### Prerequisites
- Authenticated session with staff management permissions
- Institution context established
- Department/program configuration

### Workflow Steps

#### Step 1: Staff Directory Viewing
- **Entry Point**: `/admin/staff`
- **Data Shown**: Staff list with roles, departments, contact info
- **Status Tracking**: Active/Inactive, Qualification levels

#### Step 2: Staff Record Creation/Editing
- **Entry Point**: Create button or Edit action
- **Fields**: Name, Role, Qualifications, Contact, Assigned Programs
- **Relationships**: Links to programs/courses staff can teach/examine

#### Step 3: Examiner Assignment
- **Entry Point**: Staff profile → Examination assignment (inferred)
- **Purpose**: Assign staff as examiners for specific programs/periods
- **State**: Examiner status added to staff record

### State Transitions
```
New Staff → Active
Active → Examiner Assigned
Active → On Leave
Active → Retired/Resigned → Inactive
```

---

## Workflow 6: Financial Transaction Processing

### Overview
Tracking institutional financial transactions including deposits, expenditures, and balances.

### Prerequisites
- Authenticated session with financial permissions
- Accounting period configured and open
- Transaction categories configured

### Workflow Steps

#### Step 1: Transaction Recording
- **Entry Point**: `/admin/finance/transactions`
- **Fields**: Date, Type, Amount, Description, Reference, Counterparty
- **Types**: Deposit, Expenditure, Transfer, Adjustment

#### Step 2: Transaction Review
- **Entry Point**: `/admin/finance/transactions/pending`
- **Filter**: Status = Pending
- **Actions**: Approve, Reject, Escalate

#### Step 3: Transaction Approval
- **State Change**: Pending → Completed/Failed
- **Balance Update**: Automatic recalculation of account balances
- **Dashboard Reflection**: Total Deposits/Expenditure/Balance updated

#### Step 4: Period Closure
- **Entry Point**: `/admin/finance/accounting-periods`
- **Actions**: Open new period, Close current period, Reconcile
- **Validation**: All transactions must be posted before closure

### State Transitions
```
Transaction Created → Pending
Pending → Approved/Completed
Pending → Rejected/Failed
Completed → Included in Period Balance
Period → Open → Closed → Archived
```

---

## Workflow 7: Support Ticket Management

### Overview
Handling institutional support requests and issues.

### Prerequisites
- Authenticated session (may have restrictions observed: 403 Forbidden)
- Institution context established
- Issue context (student, transaction, technical)

### Workflow Steps

#### Step 1: Ticket Creation
- **Entry Point**: `/admin/tickets/new` (observed as restricted/403)
- **Fields**: Subject, Description, Category, Priority, Related Entity
- **Attachment Support**: File uploads possible

#### Step 2: Ticket Submission
- **Validation**: Required fields, reasonable length, valid category
- **Notification**: System generates notification for support team

#### Step 3: Ticket Processing
- **Entry Point**: `/admin/tickets` (observed as restricted/403)
- **Actions**: Assign, Prioritize, Resolve, Close
- **Communication**: Threaded replies, status updates

#### Step 4: Ticket Resolution
- **State Change**: Open → In Progress → Resolved/Closed
- **Feedback**: Customer satisfaction rating (inferred)
- **Archive**: Move to historical storage

### State Transitions
```
Created → Open
Open → Assigned
Assigned → In Progress
In Progress → Pending Customer (awaiting response)
Pending Customer → Resolved
Resolved → Closed
Closed → Archived (after retention period)
```

### Observed Restriction
- Support ticket system endpoints returned HTTP 403 Forbidden
- May indicate permission limitations for current user role
- May indicate feature not enabled for this institution
- Requires administrator review to enable

---

## Workflow 8: Continuous Assessment

### Overview
Tracking continuous assessment results for students.

### Prerequisites
- Students enrolled in programs
- Assessment periods configured
- Examiner assignments made

### Workflow Steps

#### Step 1: Assessment Scheduling
- **Entry Point**: `/admin/exam/schedules` (observed as restricted/403)
- **Fields**: Program, Period, Date, Venue, Examiner

#### Step 2: Result Entry
- **Entry Point**: Continuous Assessment module
- **Fields**: Student ID, Assessment Component, Score, Max Score, Grade
- **Validation**: Score within valid range, student enrolled

#### Step 3: Result Publication
- **Entry Point**: Continuous Assessment → Publish
- **Visibility**: Student portal or institutional records
- **Notification**: Students notified of available results

#### Step 4: Result Review/Appeal
- **Entry Point**: Student or staff appeal process
- **Actions**: Re-grade, Correct, Uphold original

### Observed Restriction
- Continuous assessment endpoint returned HTTP 403 Forbidden
- May indicate feature not enabled or permission limitations

---

## Cross-Cutting Workflows

### Authentication & Session Management
1. User navigates to login page
2. Credentials submitted with CSRF protection
3. Session established with encrypted cookie
4. User redirected to dashboard
5. Activity tracked via Livewire/Turbo
6. Session timeout or logout terminates session

### Navigation Between Modules
1. Sidebar navigation provides primary module access
2. Header provides quick actions (notifications, profile)
3. Turbo Drive enables fast page transitions
4. Breadcrumb-style navigation inferred from header titles
5. Deep linking supported via URL parameters

### Data Export & Reporting
1. TableExport library available for CSV/Excel/PDF export
2. Highcharts configured with export options (PNG, JPEG, PDF, SVG)
3. User Manual download available
4. Filter states preserved in URLs for shareable views

---

## Validation Rule Summary

| Workflow | Key Validations | Error Handling |
|----------|----------------|----------------|
| Student Creation | Required fields, unique email, valid dates | Form-level errors, toast notifications |
| HTIN Application | Institution context, program validity, period open | AJAX validation, inline errors |
| HTIN Approval | Authorization, student eligibility | Confirmation dialogs, success/error toasts |
| Financial Transaction | Amount validity, date in period, authorization | Server-side validation, rollback on error |
| Support Ticket | Required fields, category selection | Form validation, submission errors |
| Assessment Result | Score range, student enrollment | Range validation, duplicate prevention |

### Approval Boundaries
- Student management: Institution-level permissions
- HTIN Registration: Registration management permissions
- Financial: Financial management permissions (may require multiple authorization levels)
- Support: May be restricted based on observed 403 responses
- Assessment: May be restricted based on observed 403 responses

---
