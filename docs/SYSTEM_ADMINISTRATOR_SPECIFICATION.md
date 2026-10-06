# System Administrator Specification

## Overview
The System Administrator is the highest-privilege operational/system role in the SMIS. They are responsible for managing the entire system, including users, roles, permissions, configuration, security, data, and system operations.

## 1. SYSTEM ADMINISTRATOR DASHBOARD

### 1.1 Administrator Dashboard
The first screen should give the System Administrator a complete view of the entire SMIS.

#### Live Statistics
- Total users
- Active users
- Inactive users
- Locked users
- Staff
- Students
- Institutions
- Departments
- Programmes/classes
- Active academic year
- Current term/semester
- Pending approvals
- Recent system activity
- Security alerts
- System errors

#### System Health
- Backend/API status
- Database status
- Authentication status
- File storage status
- Notification service
- Background jobs
- Backup status
- Server/storage capacity

#### Quick Actions
- Create User
- Create Staff Account
- Assign Role
- Manage Permissions
- Reset Password
- Lock/Unlock Account
- Create Department
- Configure Academic Year
- System Settings
- Backup Database
- View Audit Logs

## 2. USER MANAGEMENT
The System Administrator has full user-account management.

### Users
- Create
- View
- Edit
- Activate
- Deactivate
- Lock
- Unlock
- Delete where permitted
- Reset password
- Force password change
- Force logout
- Assign roles
- Remove roles
- View login history
- View user activity

### Staff Accounts
Manage staff accounts and their system access.

### Student Accounts
Manage student portal/system accounts where enabled.

### Sessions
- Active sessions
- Device
- IP address
- Login time
- Last activity
- Force logout

## 3. ROLES & PERMISSIONS
The System Administrator controls the complete RBAC system.

### Roles
Manage all institutional roles:
- Principal
- Deputy Principal
- Accountant
- Assistant Accountant
- Registrar
- Admissions Officer
- Librarian
- Warden
- Teacher/Lecturer
- Nurse/Clinical Officer
- Pharmacist
- Laboratory Staff
- Records Officer
- System Administrator

### Permissions
Create and manage granular permissions:
- students.view
- students.create
- students.edit
- students.delete
- finance.view
- finance.create
- finance.approve
- finance.reverse
- library.view
- library.issue
- library.return
- hostel.view
- hostel.checkin
- hostel.checkout
- users.view
- users.create
- users.edit
- users.disable
- reports.view
- reports.export
- system.settings
- system.audit
- system.security

### Permission Matrix
The Administrator should be able to see:

| Module   | View | Create | Edit | Delete | Approve |
|----------|------|--------|------|--------|---------|
| Students | ✓    | ✓      | ✓    | ✓      | —       |
| Finance  | ✓    | ✓      | ✓    | —      | ✓       |
| Library  | ✓    | ✓      | ✓    | —      | —       |
| Hostel   | ✓    | ✓      | ✓    | —      | —       |
| Users    | ✓    | ✓      | ✓    | ✓      | —       |
| System   | ✓    | ✓      | ✓    | ✓      | ✓       |

## 4. INSTITUTION MANAGEMENT
The System Administrator manages the complete institutional structure.

### Institution
- Institution profile
- Institution type
- Registration details
- Contacts
- Address
- Logo
- System identity
- Active/inactive status

### Departments
- Create
- Edit
- Disable
- Assign department heads
- Assign staff

### Programmes
- Create
- Edit
- Disable
- Programme structure

### Classes / Streams
- Create
- Edit
- Archive

## 5. ACADEMIC CONFIGURATION
Full system configuration for academic operations:
- Academic years
- Terms
- Semesters
- Intakes
- Classes
- Streams
- Subjects
- Courses
- Programmes
- Departments
- Grading systems
- Assessment types
- Examination types
- Academic calendar

This allows the Administrator to prepare the system before operational users begin working.

## 6. SYSTEM-WIDE MANAGEMENT
This is where the Administrator differs from every other role.

### System Settings
- Institution settings
- Currency
- Time zone
- Date format
- Number format
- Language
- System name
- Branding
- Logo
- Email settings
- SMS settings
- Notification settings

### Numbering
Configure:
- Student numbers
- Admission numbers
- Invoice numbers
- Receipt numbers
- Purchase orders
- Library numbers
- Document numbers

## 7. SECURITY CENTRE
Full system security management.

### Security Controls
- Password policy
- Login attempt limits
- Account lockout
- Session timeout
- MFA
- Authentication settings
- Security notifications
- Access restrictions

### Security Monitoring
- Failed logins
- Suspicious activity
- Locked accounts
- Unauthorized requests
- Privilege changes
- Security events

## 8. AUDIT & ACTIVITY
The Administrator gets complete audit visibility.
Every important operation records:
- User
- Action
- Module
- Record
- Date/Time
- IP Address
- Device
- Previous Value
- New Value
- Result

### Examples:
- Principal approved procurement.
- Accountant posted payment.
- Warden issued stock.
- Librarian issued a book.
- Administrator changed a permission.
- Administrator disabled a user.
Nothing important should happen silently.

## 9. DATA MANAGEMENT
The System Administrator has responsibility for the system's data layer.

### Import
- Students
- Staff
- Users
- Classes
- Subjects
- Finance records
- Inventory
- Other supported datasets

### Export
- CSV
- Excel
- PDF
- System reports

### Data Validation
Before importing:
- Required fields
- Duplicate detection
- Invalid references
- Invalid dates
- Invalid IDs
- Data-type validation

## 10. BACKUP & RESTORE
Full administrative control over backups.

### Backup
- Database backup
- File backup
- Configuration backup
- Backup history
- Backup verification

### Restore
- Select backup
- Verify backup
- Restore
- Record restoration event
Restoration must require explicit confirmation and be fully audited.

## 11. SYSTEM HEALTH
### Live Monitoring
- API: ONLINE
- DATABASE: ONLINE
- AUTHENTICATION: ONLINE
- FILE STORAGE: ONLINE
- NOTIFICATIONS: ONLINE
- BACKGROUND JOBS: RUNNING
- BACKUP: HEALTHY

### Also:
- CPU usage
- Memory
- Storage
- Database size
- API response time
- Error rate
- Background job status

## 12. BACKGROUND JOBS
Manage:
- Scheduled jobs
- Running jobs
- Completed jobs
- Failed jobs
- Retry
- Job history
- Execution logs

## 13. NOTIFICATIONS
Manage the entire notification system.

### Templates
- Admission
- Fees
- Receipts
- Results
- Leave
- Account activation
- Password reset
- System alerts
- Announcements

### Delivery
Track:
- Recipient
- Channel
- Status
- Sent time
- Delivered
- Failed
- Failure reason

## 14. FILE & DOCUMENT MANAGEMENT
The Administrator can manage system-wide storage:
- Uploaded documents
- Attachments
- Reports
- Student documents
- Staff documents
- File storage
- File access
- File cleanup

## 15. INTEGRATIONS
Manage system integrations:
- Email
- SMS
- Payment gateways
- Authentication
- Storage
- External APIs
- Library systems
- Other institutional integrations

## 16. REPORTS
System Administrator reports include:

### Users
- Users by role
- Active users
- Inactive users
- Login activity

### Security
- Failed logins
- Locked accounts
- Security events
- Permission changes

### Audit
- Administrative actions
- User activity
- Configuration changes

### System
- Performance
- Errors
- Storage
- Database
- Background jobs
- Backups

## 17. ADMINISTRATOR CONTROL CENTRE
This is important.
The Administrator should have a central place to manage the entire SMIS:

### CONTROL CENTRE
```
Users                    248
Active Users             231
Locked Accounts            3
Pending Approvals          7

System Health
API                      ✓
Database                 ✓
Storage                  ✓
Notifications            ✓
Backups                  ✓

Security
Failed Logins             12
Security Alerts             2

Background Jobs
Running                    4
Failed                     0

Recent Administrative Activity
...
```

### Navigation Structure
- SYSTEM ADMINISTRATOR
  - Dashboard
  - Control Centre

- USER MANAGEMENT
  - Users
  - Staff Accounts
  - Student Accounts
  - Sessions
  - Login History

- ROLES & PERMISSIONS
  - Roles
  - Permissions
  - Role Assignments
  - Permission Matrix

- INSTITUTION
  - Institution Profile
  - Departments
  - Programmes
  - Classes
  - Streams

- ACADEMIC CONFIGURATION
  - Academic Years
  - Terms / Semesters
  - Intakes
  - Subjects / Courses
  - Grading Systems
  - Assessment Types
  - Examination Types
  - Academic Calendar

- SYSTEM CONFIGURATION
  - General Settings
  - Branding
  - Numbering
  - Academic Settings
  - Finance Settings
  - Document Settings
  - Notification Settings

- SECURITY
  - Security Dashboard
  - Security Settings
  - Security Events
  - Access Control

- AUDIT & ACTIVITY
  - Audit Dashboard
  - Audit Log
  - User Activity
  - Configuration History

- DATA MANAGEMENT
  - Import Data
  - Export Data
  - Data Validation
  - Data Management

- BACKUP & RESTORE
  - Backup Dashboard
  - Backup History
  - Restore

- SYSTEM HEALTH
  - System Health
  - API
  - Database
  - Storage
  - Background Jobs

- NOTIFICATIONS
  - Templates
  - Notification Logs
  - Delivery Status

- FILES & DOCUMENTS
  - File Management
  - Storage
  - Access History

- INTEGRATIONS
  - Integrations
  - Connection Status
  - Integration Logs

- REPORTS
  - User Reports
  - Security Reports
  - Audit Reports
  - System Reports

- ADMINISTRATION
  - Pending Approvals
  - Approval History