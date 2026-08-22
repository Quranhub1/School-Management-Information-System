# Requirements

## System goal

Provide a maintainable, production-oriented School Management Information System for Ugandan tertiary, higher-education and TVET institutions. The system must centralize institutional operations while remaining usable over the local network without Internet access for normal internal workflows.

## Operating boundary

The SMIS is a **local-first, on-premises school system**. Normal internal workflows must not require the Internet or third-party cloud services. Student/guardian Internet portals are outside the current scope. Any future external or Internet-connected integration must be explicitly approved and isolated from the core local system.

## Institutional model

The system must support:

```text
Institution → Campus → Faculty/School → Department → Programme
Programme → Curriculum Version → Programme Course → Course
Academic Year → Academic Period
Intake → Student Enrollment → Period Registration → Course Registration
Course Registration → Attendance / Assessment / Results / Progression
```

Terminology must be configurable so an institution can use semester, term, trimester or block without changing the underlying model.

## Core modules

1. Identity and access management
2. Institution and campus administration
3. Faculty/school and department management
4. Programme and curriculum management
5. Admissions and enrollment
6. Student, guardian and next-of-kin management
7. Academic years, periods and intakes
8. Course/unit management and registration
9. Attendance
10. Assessment and examinations
11. Results, progression and transcripts
12. Staff, teaching allocation and workload
13. Clinical, practical and workplace learning
14. Finance and fees
15. Library management
16. Communication and local notifications
17. Graduation, certification and alumni
18. Reporting and dashboards
19. System administration and audit logging

## Uganda-oriented academic requirements

### Programme and curriculum

- Programmes must have configurable award type, award title, duration, study mode and delivery model.
- Programme approval/accreditation references must be stored as metadata.
- Curriculum versions must be independently versioned and preserved historically.
- Curriculum must support conventional academic and competency-based education/training models.

### Admissions

- Application records must exist before student records where the workflow requires it.
- Applications must identify programme and intended intake.
- Admission decisions must be auditable.
- Admission/reference numbers must be distinct from the internal student primary key.

### Students

- Student identity must be separated from academic enrollment.
- Multiple guardians/next-of-kin may be recorded.
- Student status must support active, deferred, completed, withdrawn, graduated and other configured states.
- Disability/support information must be handled securely where required.

### Academic registration

- A student may enroll in a programme and register for an academic period.
- Course registration must reference the curriculum course, not merely the course master record.
- Repeats and multiple attempts must be represented.
- Historical registrations must remain traceable.

### Assessment

The system must support:

- theory examinations;
- continuous assessment;
- practical assessment;
- clinical assessment;
- workplace/industrial attachment assessment;
- competency-based assessment;
- numeric scores and/or competency outcomes;
- assessor identity and approval;
- result publication and locking;
- configurable special result codes such as X where required by the applicable institutional/board recording convention.

### Progression and completion

The system must record progression decisions such as progress, repeat, defer, withdraw and complete. Completion must support clearance, final results, transcript generation and graduation/certification.

## Cross-cutting requirements

- Role-based access control.
- Auditability of important changes.
- API and database validation.
- Secure password and credential handling.
- Consistent error handling.
- Automated tests for business-critical workflows.
- Database migrations under version control.
- Backup and restore procedures.
- LAN-first deployment.
- Responsive interface for institutional devices.
- Configurable terminology and institutional rules.
- Historical academic data preservation.
- No mandatory Internet dependency for normal internal workflows.

## Non-functional requirements

### Reliability

The system must preserve data integrity and fail predictably when optional dependencies are unavailable.

### Security

Authentication, authorization, input validation, secret management, audit logging and least-privilege access are mandatory.

### Maintainability

Domains must be modular, testable, documented and independently evolvable where practical.

### Performance

Common registry, admissions, academic, finance and reporting operations should remain responsive on the local network with multiple concurrent users.

### Offline/LAN operation

Normal internal operations must function without third-party cloud services or Internet connectivity. Any explicitly approved external integration must be isolated and must not prevent the core SMIS from operating locally.
