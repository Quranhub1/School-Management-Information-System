# OSRS Audit Gaps and Unverified Assumptions

## Pages That Could Not Be Accessed

### 1. Examination Schedules (`/admin/exam/schedules`)
- **Status**: HTTP 403 Forbidden
- **Reason**: Permission restriction for current user role
- **Impact**: Cannot inspect continuous assessment scheduling interface, exam timetable management, or examiner assignments
- **Required Access**: Likely needs "Continuous Assessment" or "Examination Management" permission

### 2. Support Ticket System
- **Request Help** (`/admin/tickets/new`) - HTTP 403 Forbidden
- **My Support Requests** (`/admin/tickets`) - HTTP 403 Forbidden
- **Reason**: Permission restriction or feature not enabled for this institution
- **Impact**: Cannot inspect ticket creation form, ticket list, threaded conversations, assignment workflow, or SLA tracking
- **Required Access**: Likely needs "Support Management" permission

### 3. Student Research (`/admin/student-research`)
- **Status**: HTTP 403 Forbidden
- **Reason**: Permission restriction or feature not enabled
- **Impact**: Cannot inspect research project tracking, publication management, or supervisor assignment

### 4. Student Academic Profiles (`/admin/students/{id}/academic-profile`)
- **Status**: Link observed but not accessed
- **Reason**: Requires specific student ID navigation; not directly accessible from list without clicking through
- **Impact**: Cannot inspect academic history view, course enrollment timeline, examination results display, or certification tracking

### 5. Student Detail/Edit Modals
- **Status**: Triggered via JavaScript (Livewire/Turbo) from table actions
- **Reason**: Cannot be directly accessed via URL; require interaction with table row actions
- **Impact**: Cannot inspect form field layouts, validation rules, photo upload, or relationship management in modal context

### 6. HTIN Application Details (`/admin/registrations/htin/applications/details?...`)
- **Status**: Link observed but not accessed
- **Reason**: Requires specific query parameters (institution_id, course_id, htin_registration_id)
- **Impact**: Cannot inspect individual application breakdown, student-level details, or document verification interface

### 7. HTIN Registration Details (`/admin/registration/htin/details?...`)
- **Status**: Link observed but not accessed
- **Reason**: Requires specific query parameters (institution_id, course_id, htin_registration_id, status)
- **Impact**: Cannot inspect registration approval workflow, student-by-student status management, or batch operations

### 8. Exam Application Details (`/admin/registrations/exam/applications/details?...`)
- **Status**: Not accessed
- **Impact**: Cannot inspect exam application review workflow

### 9. Exam Registration Details (`/admin/registrations/exam/registrations/details?...`)
- **Status**: Not accessed
- **Impact**: Cannot inspect exam candidate management, hall ticket generation, or seating arrangement

### 10. Finance Transaction Details
- **Status**: Not accessed (table rows have action dropdowns but not inspected)
- **Impact**: Cannot inspect transaction audit trail, supporting document attachment, reversal workflow, or reconciliation interface

### 11. Accounting Period Operations
- **Status**: List viewed but create/edit/close/reconcile actions not tested
- **Impact**: Cannot inspect period opening validation, closing reconciliation, or balance carry-forward logic

### 12. New HTIN Applications Modal
- **Status**: Modal structure observed in HTML but not interacted with
- **Impact**: Cannot verify cascading dropdown behavior (Institution → Period → Program), form validation, or submission flow

### 13. User Management & Permissions
- **Status**: No navigation item found
- **Impact**: Cannot inspect role management, permission assignment, user provisioning, or audit log access

### 14. Configuration & Settings
- **Status**: No navigation item found
- **Impact**: Cannot inspect system settings, institution configuration, notification templates, or integration endpoints

### 15. Institution Information
- **Status**: Header shows "KAMPALA SCHOOL OF HEALTH SCIENCES" but no dedicated institution management screen found
- **Impact**: Cannot inspect multi-institution support, institution hierarchy, or branding configuration

---

## Unverified Assumptions

### Technical Assumptions
| Assumption | Basis | Risk Level |
|------------|-------|------------|
| MySQL/MariaDB database | Laravel default, Ubuntu stack | Medium - No direct confirmation |
| PHP 8.x runtime | Laravel 9+ requirement | Low - Strong version requirement |
| Soft deletes on students | Common Laravel pattern | Medium - Not confirmed |
| Row-level security for multi-tenancy | Institution context in header | High - Critical for SMIS design |
| Background job processing (queues) | Not observed | Medium - May affect async operations |
| Email notifications | Inferred from support system | Medium - Not observed |
| File storage on local filesystem | `/storage/` path in header | Low - Consistent with Laravel default |

### Functional Assumptions
| Assumption | Basis | Risk Level |
|------------|-------|------------|
| Multi-institution support | Header shows institution name | Medium - May be single-tenant per deployment |
| Role-based access control | 403 responses observed | Medium - Granularity unknown |
| HTIN ↔ Student 1:1 relationship | HTIN field on student table | Low - Strong evidence |
| Financial period affects transaction posting | Period filter on transactions | Low - Strong pattern |
| Real-time notifications via polling | 60-second interval in meta | Low - Confirmed polling |
| Export uses TableExport library | Library included in assets | Low - Library present |
| Charts use Highcharts | Scripts included, containers present | Low - Direct evidence |

### Security Assumptions
| Assumption | Basis | Risk Level |
|------------|-------|------------|
| CSRF protection on all state changes | Tokens in forms and meta | Low - Confirmed |
| Password hashing | Laravel default | Low - Framework standard |
| Session encryption | Encrypted cookie format | Low - Laravel standard |
| No rate limiting observed | Not tested | High - Should be verified |
| No MFA observed | Not in login form | Medium - May be configured |
| No API rate limiting | No API endpoints discovered | Medium - Should be verified |

---

## Technical Uncertainties

### 1. API Layer Existence
- **Question**: Is there a separate API for mobile/integration clients?
- **Evidence**: No `/api/` routes discovered (404 on `/api/`)
- **Uncertainty**: May exist under different path or not implemented

### 2. WebSocket/SignalR Usage
- **Question**: Is real-time functionality only polling-based?
- **Evidence**: 60-second polling interval confirmed; no WebSocket connections observed
- **Uncertainty**: May exist for specific features not triggered during audit

### 3. Caching Strategy
- **Question**: What caching layers are implemented?
- **Evidence**: Cache-Control headers on responses; no cache tags or keys observed
- **Uncertainty**: Redis vs file cache, TTL policies, invalidation strategy

### 4. Database Migration/Versioning
- **Question**: How are schema changes managed?
- **Evidence**: Not observable from frontend
- **Uncertainty**: Laravel migrations? Raw SQL? Version control?

### 5. Backup/Disaster Recovery
- **Question**: What backup strategy exists?
- **Evidence**: Not observable
- **Uncertainty**: Critical for production system assessment

### 6. Logging & Monitoring
- **Question**: What observability is in place?
- **Evidence**: Not observable
- **Uncertainty**: Error tracking, performance monitoring, audit logging

---

## Recommended Next Inspection Steps

### Immediate (High Priority)
1. **Request elevated permissions** to access:
   - Examination Schedules (`/admin/exam/schedules`)
   - Support Tickets (`/admin/tickets`, `/admin/tickets/new`)
   - Student Research (`/admin/student-research`)
   
2. **Interact with modal forms**:
   - Click "Details" and "Edit" on student rows to inspect modal forms
   - Open "New HTIN Applications" modal to verify cascading dropdowns
   - Test "Sync Picture (Legacy/API)" workflow

3. **Access detail views**:
   - Navigate to HTIN Applications Details with valid parameters
   - Navigate to HTIN Registration Details with valid parameters
   - Access Student Academic Profile from a student row

### Short Term (Medium Priority)
4. **Test workflows end-to-end**:
   - Create a test student record (if safe in environment)
   - Submit HTIN application for test student
   - Approve/reject HTIN registration
   - Record financial transaction and approve

5. **Inspect restricted modules with appropriate role**:
   - Request "Continuous Assessment" permission
   - Request "Support Management" permission
   - Request "Examination Management" permission

6. **Verify security controls**:
   - Test rate limiting on login and API endpoints
   - Verify HTTPS enforcement (currently HTTP only)
   - Check CSP headers and security headers
   - Test file upload validation

### Long Term (Low Priority)
7. **Technical deep-dive** (requires backend access):
   - Review Laravel routes (`php artisan route:list`)
   - Inspect database schema (`php artisan migrate:status`)
   - Review queue workers and scheduled tasks
   - Examine logging configuration
   - Review backup and monitoring setup

8. **Multi-tenancy verification**:
   - Test with different institution credentials
   - Verify data isolation between institutions
   - Check institution switching capability

---

## Summary of Coverage

| Category | Total Discovered | Accessed | Restricted | Not Found |
|----------|------------------|----------|------------|-----------|
| Main Navigation | 11 | 9 | 2 (Support, Student Research) | 0 |
| Submenu Items | 10 | 8 | 2 (Exam Schedules, Support sub-items) | 0 |
| Header Actions | 4 | 3 | 0 | 0 |
| **Unique Screens** | **25+** | **11** | **6** | **8+** |
| **Workflow Paths** | **8+** | **4** | **2** | **2+** |

### Modules Fully Inspected (Direct Observation)
- ✅ Dashboard
- ✅ Students Management (list view)
- ✅ Staff Management (list view - assumed similar to students)
- ✅ HTIN Applications (list view)
- ✅ HTIN Registrations (list view)
- ✅ Finance Transactions (list view)
- ✅ Pending Transactions (list view)
- ✅ Accounting Periods (list view)
- ✅ Notifications
- ✅ Profile
- ✅ User Manual Download

### Modules Partially Inspected
- ⚠️ Exam Registration (applications/registrations lists accessible; schedules restricted)
- ⚠️ Support Request (menu visible; all sub-items restricted)
- ⚠️ Student Management (detail/edit modals not accessed)
- ⚠️ HTIN Registration (detail views not accessed)

### Modules Not Accessible
- ❌ Continuous Assessment / Exam Schedules (403)
- ❌ Support Ticket System - Create & List (403)
- ❌ Student Research (403)
- ❌ User Management & Permissions (no nav)
- ❌ Configuration & Settings (no nav)
- ❌ Institution Management (no dedicated screen)

---

## Critical Security Gap
**HTTPS NOT ENFORCED**: The entire system operates over plain HTTP. All authentication credentials, session cookies, CSRF tokens, and sensitive data are transmitted unencrypted. This is a critical vulnerability that must be addressed before any production use or further integration.
