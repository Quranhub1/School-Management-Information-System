# Database Architecture

## Principles

- The relational database is a first-class application component.
- Schema changes are represented by migrations and reviewed through Git.
- Business rules must not depend on undocumented database state.
- Referential integrity and appropriate constraints are enforced at the database boundary.
- Historical academic records must remain immutable except through controlled corrections.
- Curriculum versions must be preserved when they have been used by students.
- Sensitive data is protected through authorization and least-privilege database access.
- Production databases require tested backup and restore procedures.

## Database technology

Entity Framework Core is used for persistence and migrations. PostgreSQL is the preferred production database for the LAN-first deployment.

## Core institutional tables

The authoritative field catalogue is maintained in [`UGANDA_INSTITUTIONAL_MODEL.md`](UGANDA_INSTITUTIONAL_MODEL.md).

### Identity and institution

- `users`
- `roles`
- `user_roles`
- `institutions`
- `campuses`
- `faculties`
- `departments`

### Academic structure

- `programmes`
- `curriculum_versions`
- `courses`
- `programme_courses`
- `academic_years`
- `academic_periods`
- `intakes`

### Admissions and students

- `admission_applications`
- `students`
- `student_guardians`
- `student_enrollments`
- `student_period_registrations`
- `course_registrations`

### Academic delivery and assessment

- `attendance_sessions`
- `attendance_records`
- `assessments`
- `assessment_results`
- `course_results`
- `progression_decisions`
- `transcripts`

### Staff and practical learning

- `staff`
- `staff_departments`
- `teaching_allocations`
- `workplace_placements`
- `placement_supervisors`
- `placement_assessments`

### Finance

- `fee_structures`
- `fee_items`
- `student_charges`
- `invoices`
- `payments`
- `receipts`
- `waivers_sponsorships`
- `refunds`

### Library

- `bibliographic_records`
- `library_items`
- `borrowers`
- `loans`
- `reservations`
- `fines`

### Completion and administration

- `completion_clearances`
- `graduation_cohorts`
- `qualifications`
- `certificates`
- `alumni`
- `notifications`
- `audit_logs`

## Critical relationship rules

```text
Institution
  └── Campus
      └── Faculty/School
          └── Department
              └── Programme
                  └── Curriculum Version
                      └── Programme Course ── Course

Academic Year ── Academic Period
Intake ── Student Enrollment ── Student
Student ── Period Registration ── Academic Period
Student ── Course Registration ── Programme Course
Course Registration ── Assessment ── Assessment Result
Course Registration ── Course Result
Student Enrollment ── Progression Decision
```

## Important modelling rules

1. `students` stores the learner's identity; it does not store the entire academic history.
2. `programmes` define qualifications; `curriculum_versions` define the version applicable at a particular time.
3. `programme_courses` is the junction that places a course in a programme curriculum.
4. `courses` are reusable academic units and should not contain a single hard-coded programme relationship.
5. `academic_periods` are generic so the institution can configure semester, term, trimester or block terminology.
6. `intakes` are independent from academic years.
7. Results are tied to the student's actual registration/assessment context.
8. CBE/CBET data must support competency outcomes in addition to numeric scores where applicable.
9. Clinical, practical and workplace learning must be first-class records, not free-text notes.
10. Regulatory identifiers are metadata; internal UUIDs remain primary keys.

## Ugandan alignment

The model is intended to accommodate Ugandan higher-education and TVET requirements, including approved programmes/curricula, admissions, competency-based education/training, practical learning, assessment and institutional reporting. See the institutional model document for the official reference basis.
