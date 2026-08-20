# Uganda Institutional Data Model

## Purpose

This document defines the institutional and academic data model used by the SMIS. It is designed for Ugandan higher-education, tertiary and TVET institutions while remaining configurable for institution-specific terminology.

The model is informed by Ugandan Ministry of Education and Sports (MoES) and National Council for Higher Education (NCHE) requirements and terminology. It must not hard-code one regulator's workflow because institutions may fall under different regulatory regimes.

## Regulatory design principles

- Institutions, programmes and qualifications must be configurable rather than hard-coded.
- Programme records must support award type, duration, delivery mode, accreditation/approval metadata and active status.
- Curriculum records must support both conventional academic delivery and competency-based education/training (CBE/CBET) where applicable.
- Assessment must support theory, practical, workplace/field and competency-based assessment where the programme requires it.
- Student progression must be traceable from admission through enrolment, registration, assessment, completion and graduation/certification.
- The system must support intakes and academic periods independently.
- Regulatory/reference identifiers should be stored as metadata and never treated as the student's internal primary key.

## Institutional hierarchy

```text
Institution
├── Campus / Site
├── Faculty / School / Directorate
│   └── Department / Unit
│       └── Programme
│           └── Curriculum Version
│               └── Programme Course
│                   └── Course / Unit
└── Academic Structure
    ├── Academic Year
    │   └── Semester / Term / Block
    └── Intake
```

## Student lifecycle

```text
Application
  ↓
Admission Decision
  ↓
Student Profile
  ↓
Programme Enrollment
  ↓
Semester Registration
  ↓
Course / Unit Registration
  ↓
Attendance / Practical / Clinical / Workplace Learning
  ↓
Assessment
  ↓
Results / Competency Record
  ↓
Progression / Repeat / Deferment
  ↓
Completion
  ↓
Graduation / Certification / Alumni
```

## Table catalogue

### Institution

| Field | Purpose |
|---|---|
| id | Internal primary key |
| code | Institutional short code |
| name | Registered/institutional name |
| institution_type | HEI, university, college, TVET, training institute, etc. |
| registration_number | Regulatory/institution registration reference |
| regulator | Configurable regulator/reference authority |
| address | Physical address |
| district | District |
| region | Region |
| phone | Main contact |
| email | Main contact email |
| website | Public website |
| status | Active/inactive |

### Campus / Site

| Field | Purpose |
|---|---|
| id | Primary key |
| institution_id | Parent institution |
| code | Site code |
| name | Campus/site name |
| address | Physical location |
| district | District |
| status | Active/inactive |

### Faculty / School / Directorate

| Field | Purpose |
|---|---|
| id | Primary key |
| institution_id | Parent institution |
| campus_id | Optional site |
| code | Faculty/school code |
| name | Name |
| head_staff_id | Responsible officer |
| status | Active/inactive |

### Department / Unit

| Field | Purpose |
|---|---|
| id | Primary key |
| faculty_id | Parent faculty/school |
| code | Department code |
| name | Department name |
| head_staff_id | Department head |
| status | Active/inactive |

### Programme

| Field | Purpose |
|---|---|
| id | Primary key |
| department_id | Owning department |
| code | Programme code |
| name | Programme title |
| award_type | Certificate, Diploma, Degree, etc. |
| award_title | Exact qualification title |
| duration_value | Duration |
| duration_unit | Years, semesters, terms, etc. |
| study_mode | Full-time, part-time, ODeL, blended, etc. |
| delivery_type | Academic, competency-based, mixed |
| regulator | Regulatory authority |
| approval_reference | Approval/accreditation reference |
| approval_date | Approval date |
| status | Proposed/active/suspended/closed |

### Curriculum Version

A programme may have several curriculum versions over time. Historical student records must remain attached to the curriculum version used when the student studied.

| Field | Purpose |
|---|---|
| id | Primary key |
| programme_id | Programme |
| version | Version identifier |
| effective_from | Start of applicability |
| effective_to | End of applicability, nullable |
| approval_reference | Curriculum approval reference |
| assessment_model | Conventional, CBE/CBET, mixed |
| status | Draft/approved/retired |

### Course / Unit

| Field | Purpose |
|---|---|
| id | Primary key |
| code | Course/unit code |
| name | Course/unit title |
| description | Description |
| credit_units | Credits where applicable |
| contact_hours | Guided/contact hours |
| practical_hours | Practical hours |
| workplace_hours | Workplace/field hours |
| course_type | Core, elective, compulsory, etc. |
| assessment_type | Exam, practical, competency, mixed |
| status | Active/inactive |

### Programme Course

This is the curriculum junction between a programme version and a course.

| Field | Purpose |
|---|---|
| id | Primary key |
| curriculum_version_id | Curriculum version |
| course_id | Course/unit |
| year_of_study | Expected study year |
| period_id | Expected semester/term/block |
| compulsory | Whether compulsory |
| elective_group | Optional elective grouping |
| prerequisite_course_id | Optional prerequisite |
| sequence | Delivery sequence |

### Academic Year

| Field | Purpose |
|---|---|
| id | Primary key |
| name | Example: 2026/2027 |
| start_date | Start date |
| end_date | End date |
| status | Planned/open/closed |
| is_current | Current academic year |

### Academic Period

Use a generic period table so the institution can configure semester, term, trimester or block terminology.

| Field | Purpose |
|---|---|
| id | Primary key |
| academic_year_id | Academic year |
| name | Semester I, Term II, Block 1, etc. |
| sequence | Ordering |
| start_date | Start |
| end_date | End |
| registration_open | Registration status |
| status | Planned/open/closed |

### Intake

| Field | Purpose |
|---|---|
| id | Primary key |
| code | Intake code |
| name | January 2026, August 2026, etc. |
| application_open | Application opening |
| application_close | Application closing |
| start_date | Training start |
| status | Open/closed |

### Student

The student table stores the person's institutional identity. Academic history belongs in related records.

| Field | Purpose |
|---|---|
| id | Internal primary key |
| student_number | Institution-issued student number |
| admission_number | Admission reference |
| first_name | First name |
| other_names | Other names |
| last_name | Last name |
| date_of_birth | Date of birth |
| sex | Sex |
| nationality | Nationality |
| national_id | National identification reference where applicable |
| phone | Contact |
| email | Contact email |
| address | Address |
| disability_status | Disability/support information where applicable |
| photo_reference | Photo storage reference |
| status | Applicant/active/deferred/completed/graduated/withdrawn/etc. |
| created_at | Record creation timestamp |

### Student Guardian / Next of Kin

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| full_name | Person name |
| relationship | Parent/guardian/next of kin |
| phone | Contact |
| email | Contact |
| address | Address |
| is_primary | Primary contact |
| emergency_contact | Emergency contact flag |

### Admission Application

| Field | Purpose |
|---|---|
| id | Primary key |
| application_number | Application reference |
| applicant_name | Applicant identity before student creation |
| programme_id | Programme applied for |
| intake_id | Intended intake |
| application_date | Date submitted |
| entry_qualification | Entry qualification |
| application_status | Submitted/shortlisted/admitted/rejected/withdrawn |
| decision_date | Decision date |
| decision_reason | Decision notes |

### Student Enrollment

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| programme_id | Programme |
| curriculum_version_id | Curriculum followed |
| intake_id | Intake |
| admission_date | Admission date |
| enrollment_date | Enrollment date |
| expected_completion_date | Expected completion |
| current_year | Current year of study |
| status | Active/deferred/completed/withdrawn/etc. |

### Semester / Period Registration

| Field | Purpose |
|---|---|
| id | Primary key |
| student_enrollment_id | Enrollment |
| academic_period_id | Semester/term/block |
| registration_date | Date |
| year_of_study | Year at registration |
| status | Registered/cleared/withdrawn |

### Course Registration

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| programme_course_id | Curriculum course |
| academic_period_id | Semester/term/block |
| registration_date | Date |
| attempt_number | Attempt number |
| status | Registered/dropped/completed/repeat |

### Attendance

Attendance must support classroom, practical, clinical and workplace/field activities where applicable.

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| course_registration_id | Registered course |
| session_date | Date |
| session_type | Lecture/practical/clinical/workplace |
| status | Present/absent/late/excused |
| recorded_by | Staff/user |
| remarks | Notes |

### Assessment / Examination

| Field | Purpose |
|---|---|
| id | Primary key |
| course_id | Course/unit |
| academic_period_id | Academic period |
| assessment_name | CAT, practical, final, competency assessment, etc. |
| assessment_type | Theory/practical/workplace/competency |
| maximum_score | Maximum mark |
| weight | Contribution to final result |
| assessment_date | Date |
| status | Draft/published/locked |

### Student Assessment Result

| Field | Purpose |
|---|---|
| id | Primary key |
| assessment_id | Assessment |
| student_id | Student |
| score | Score |
| grade | Grade where applicable |
| competency_status | Competent/not yet competent where applicable |
| assessor_id | Assessor |
| remarks | Feedback |
| published_at | Publication timestamp |

### Final Course Result

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| course_registration_id | Registration |
| total_score | Final score |
| grade | Final grade |
| grade_point | Grade point where applicable |
| competency_status | Competency outcome where applicable |
| outcome | Pass/fail/repeat/etc. |
| approved_at | Approval timestamp |

### Progression Decision

| Field | Purpose |
|---|---|
| id | Primary key |
| student_id | Student |
| academic_period_id | Period |
| decision | Progress/repeat/defer/withdraw/complete |
| year_from | Previous year |
| year_to | New year |
| decision_date | Date |
| approved_by | Authorized officer |
| remarks | Decision notes |

## Other operational domains

### Staff

Staff records should support teaching, administrative and support personnel. Key data includes staff number, names, contact information, employment details, department, role, qualifications, professional registration where applicable, active status and user-account linkage.

### Finance

Core entities include fee structures, fee items, student charges, invoices/statements, payments, receipts, sponsorships/waivers, refunds, balances and financial audit records.

### Library

Core entities include bibliographic records, copies/items, classifications, borrowers, loans, returns, renewals, reservations, fines and library audit records.

### Clinical / Workplace Learning

Where the institution requires practical or workplace training, records should include placement, facility/employer, supervisor, placement dates, learning objectives/competencies, attendance, logbook evidence, assessment and completion status.

### Graduation / Certification / Alumni

Core entities include completion clearance, graduation cohort, award/qualification, certificate reference, transcript, issue date and alumni profile.

## Relationship rules

1. A student is not a programme. Keep person identity separate from academic enrollment.
2. A course is not a curriculum membership. Use Programme Course to place a course in a specific programme curriculum version.
3. An academic year contains configurable academic periods.
4. An intake is independent of an academic year and may overlap an academic year according to institutional practice.
5. Historical curriculum versions must never be overwritten when already used by students.
6. Results belong to the student's registration/assessment context, not directly to a course alone.
7. Regulatory identifiers are metadata; internal UUIDs remain primary keys.

## Ugandan reference basis

The model is aligned conceptually with official Ugandan education-sector material:

- Ministry of Education and Sports: TVET policy implementation standards and guidelines.
- Ministry of Education and Sports: current TVET admissions and recognized-institution information.
- National Council for Higher Education: registered institutions and academic programmes.
- National Council for Higher Education: competence-based education reforms and minimum standards.

References:

- https://www.education.go.ug/policies-and-regulations-2/
- https://www.education.go.ug/licensing-and-registration-of-private-tvet-institutions-providers/
- https://unche.or.ug/institutions/
- https://unche.or.ug/all-academic-programs/
- https://unche.or.ug/publications-2/

This document defines a configurable institutional model, not a claim that every Ugandan institution uses identical terminology or workflows.
