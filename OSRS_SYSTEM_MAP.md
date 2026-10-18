# OSRS System Map
## Observed Navigation Structure

### Main Navigation Items (Sidebar)

1. **Dashboard** (`/admin/main`)
   - Purpose: System overview with key metrics and data visualizations
   - Access: Available (HTTP 200)

2. **Manage Students** (`/admin/students`)
   - Purpose: Student directory management, profiles, and records
   - Access: Available (HTTP 200)

3. **Manage Staff & Examiners** (`/admin/staff`)
   - Purpose: Staff and examiner directory management
   - Access: Available (HTTP 200)

4. **HTIN Registration** (Collapsible Menu)
   - Purpose: Health Trainee Identification Number registration tracking
   - Access: Available (HTTP 200 for parent menu)
     - **HTIN Applications** (`/admin/registrations/htin/applications/list`)
       - Purpose: Tracking HTIN applications by program and period
       - Access: Available (HTTP 200)
     - **HTIN Registrations** (`/admin/registration/htin`)
       - Purpose: Tracking HTIN registrations by program, month, and year
       - Access: Available (HTTP 200)

5. **Exam Registration** (Collapsible Menu)
   - Purpose: Examination registration and scheduling management
   - Access: Available (HTTP 200 for parent menu)
     - **Exam Applications** (`/admin/registrations/exam/applications/list`)
       - Purpose: Tracking examination applications
       - Access: Available (HTTP 200)
     - **Exam Registrations** (`/admin/registrations/exam/registrations/list`)
       - Purpose: Tracking examination registrations
       - Access: Available (HTTP 200)
     - **Continuous Assessment** (`/admin/exam/schedules`)
       - Purpose: Managing continuous assessment schedules
       - Access: Restricted (HTTP 403 Forbidden)

6. **Manage Finances** (Collapsible Menu)
   - Purpose: Financial transaction and accounting management
   - Access: Available (HTTP 200 for parent menu)
     - **Institution Transactions** (`/admin/finance/transactions`)
       - Purpose: Tracking all financial transactions
       - Access: Available (HTTP 200)
     - **Pending Transactions** (`/admin/finance/transactions/pending`)
       - Purpose: Tracking transactions requiring action
       - Access: Available (HTTP 200)
     - **Accounting Periods** (`/admin/finance/accounting-periods`)
       - Purpose: Managing financial accounting periods
       - Access: Available (HTTP 200)

7. **Student Research** (`/admin/student-research`)
   - Purpose: Managing student research projects and publications
   - Access: Restricted (HTTP 403 Forbidden)

8. **Support Request** (Collapsible Menu)
   - Purpose: Support ticketing and helpdesk system
   - Access: Available (HTTP 200 for parent menu)
     - **Request Help** (`/admin/tickets/new`)
       - Purpose: Creating new support tickets
       - Access: Restricted (HTTP 403 Forbidden)
     - **My Support Requests** (`/admin/tickets`)
       - Purpose: Viewing existing support tickets
       - Access: Restricted (HTTP 403 Forbidden)

### Header Navigation Items

9. **Download User Manual** (`/admin/user-guide/download`)
   - Purpose: Download system user documentation
   - Access: Available (HTTP 200)

10. **Notifications** (`/admin/notifications`)
    - Purpose: System notifications and alerts center
    - Access: Available (HTTP 200)

11. **Profile** (`/admin/profile`)
    - Purpose: User profile management and settings
    - Access: Available (HTTP 200)

### Summary
- **Total Navigation Items Discovered**: 11 main items (including collapsible menus)
- **Total Unique Screens Accessible**: 9 screens (HTTP 200)
- **Total Screens Restricted**: 4 screens (HTTP 403 Forbidden)
- **Modules Fully Inspected**: Dashboard, Students, Staff, HTIN Registration, HTIN Applications, HTIN Registrations, Exam Applications, Exam Registrations, Finance Transactions, Pending Transactions, Accounting Periods, Notifications, Profile, User Manual
- **Modules Partially Inspected**: Exam Registration (applications/registrations accessible, schedules restricted), Support Request (menu accessible but all sub-items restricted), Student Research (restricted)
- **Modules Not Accessible**: Continuous Assessment, Student Research, Support Ticket System

**Security Note**: The system operates over HTTP (not HTTPS), which exposes credentials and session data to potential interception. Authentication credentials were observed in HTTP headers and cookies during initial login.
