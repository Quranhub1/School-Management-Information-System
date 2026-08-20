# Database Architecture

## Principles

- The relational database is a first-class application component.
- Schema changes are represented by migrations and reviewed through Git.
- Business rules must not depend on undocumented database state.
- Referential integrity and appropriate constraints should be enforced at the database boundary.
- Sensitive data must be protected through application-level authorization and appropriate database permissions.
- Production databases must have tested backup and restore procedures.

## Initial relational model domains

- Identity
- Students
- Staff
- Guardians
- Classes and streams
- Subjects
- Academic years and terms
- Enrollment
- Attendance
- Examinations
- Assessment results
- Fees and invoices
- Payments
- Library catalog and circulation
- Transport
- Notifications
- Audit logs

## Database technology decision

The application will use Entity Framework Core so that the domain model and migrations remain portable across supported relational database engines during development. The production database engine will be finalized after validating the server environment and operational requirements.

PostgreSQL is the preferred default candidate because it is open source, robust, and suitable for an on-premises multi-user application. SQL Server and MariaDB/MySQL remain alternatives if the deployment environment establishes a concrete requirement for them.
