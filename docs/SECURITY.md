# Security Baseline

Security is part of the architecture rather than a later add-on. The system handles student, staff, academic, financial, authentication and audit information.

## Baseline controls

- Role-based authorization.
- Secure password hashing through established framework components.
- No plaintext passwords or secrets in source control.
- Environment-specific configuration through protected deployment configuration.
- Input validation and output encoding.
- Protection against common web vulnerabilities.
- Database least-privilege access.
- Audit logging for security-sensitive and high-value institutional actions.
- Controlled administrative access.
- Backup protection and restore verification.
- Dependency updates and CI security checks where practical.
- Historical academic records must not be silently overwritten.

## Initial role domains

The final permission matrix will be institution-configurable. Initial role domains include:

- System Administrator
- Principal / Director / Institution Management
- Registrar / Academic Registry
- Admissions Officer
- Head of Faculty/School
- Head of Department
- Academic/Examinations Officer
- Lecturer / Trainer / Assessor
- Clinical/Workplace Placement Officer
- Finance Officer / Cashier
- Librarian
- Student Affairs / Welfare
- Library/Transport/Operations users
- Student
- Parent/Guardian where self-service is enabled

Roles are not equivalent to job titles. Permissions should be granted through explicit capabilities and scoped to the institution, campus, department or academic context where required.

## Sensitive information

Sensitive categories include:

- student identity and contact data;
- national identification references where collected;
- guardian/next-of-kin information;
- disability/support information;
- admission and academic records;
- assessment and examination results;
- clinical/workplace learning records;
- staff and employment records;
- financial transactions and balances;
- authentication credentials;
- audit records.

Production secrets, credentials and personally identifiable data must never be committed to the repository.
