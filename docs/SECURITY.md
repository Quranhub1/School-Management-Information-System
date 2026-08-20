# Security Baseline

Security is part of the architecture rather than a later add-on.

## Baseline controls

- Role-based authorization.
- Secure password hashing through established framework components.
- No plaintext passwords or secrets in source control.
- Environment-specific configuration through environment variables or protected deployment configuration.
- Input validation and output encoding.
- Protection against common web vulnerabilities.
- Database least-privilege access.
- Audit logging for security-sensitive and high-value business actions.
- Controlled administrative access.
- Backup protection and restore verification.
- Dependency updates and CI security checks where practical.

## Roles

The exact role matrix will be defined as requirements are refined. Initial categories include system administration, school management, finance, academics, teaching staff, library, transport, and other operational users.

## Sensitive information

Student, guardian, staff, financial, authentication, and audit information must be treated as sensitive application data. Production secrets and personally identifiable data must never be committed to the repository.
