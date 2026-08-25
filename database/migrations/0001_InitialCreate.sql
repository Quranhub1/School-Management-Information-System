-- SMIS Initial Database Schema
-- Generated: 2026-08-25
-- Target: PostgreSQL 15+
-- This script creates the full schema for the School Management Information System.
-- For EF Core migrations, use: dotnet ef migrations add InitialCreate
-- from the backend/src/SchoolManagement.Infrastructure directory.

BEGIN;

-- Identity
CREATE TABLE roles (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL UNIQUE,
    description text
);

CREATE TABLE users (
    id uuid PRIMARY KEY,
    username varchar(160) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Institution
CREATE TABLE institutions (
    id uuid PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    name varchar(300) NOT NULL,
    institution_type varchar(80),
    registration_number varchar(120),
    regulator varchar(120),
    address text,
    district varchar(120),
    region varchar(120),
    phone varchar(40),
    email varchar(160),
    website varchar(250),
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE campuses (
    id uuid PRIMARY KEY,
    institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    address text,
    district varchar(120),
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE faculties (
    id uuid PRIMARY KEY,
    institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    campus_id uuid REFERENCES campuses(id),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    head_staff_id uuid,
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE departments (
    id uuid PRIMARY KEY,
    faculty_id uuid NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    head_staff_id uuid,
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE UNIQUE INDEX ix_faculties_code ON faculties(institution_id, code);
CREATE UNIQUE INDEX ix_departments_code ON departments(faculty_id, code);

-- Academic structure
CREATE TABLE programmes (
    id uuid PRIMARY KEY,
    department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code varchar(50) NOT NULL,
    name varchar(300) NOT NULL,
    award_type varchar(80),
    award_title varchar(300),
    duration_value int,
    duration_unit varchar(40),
    study_mode varchar(60),
    delivery_type varchar(60),
    regulator varchar(120),
    approval_reference varchar(120),
    approval_date date,
    status varchar(40) NOT NULL DEFAULT 'Active',
    UNIQUE (department_id, code)
);

CREATE TABLE curricula (
    id uuid PRIMARY KEY,
    programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    version varchar(60) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    approval_reference varchar(120),
    assessment_model varchar(60),
    status varchar(40) NOT NULL DEFAULT 'Draft',
    UNIQUE (programme_id, version)
);

CREATE TABLE courses (
    id uuid PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    name varchar(300) NOT NULL,
    description text,
    credit_units int,
    contact_hours int,
    practical_hours int,
    workplace_hours int,
    course_type varchar(60),
    assessment_type varchar(60),
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE programme_courses (
    id uuid PRIMARY KEY,
    curriculum_id uuid NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    year_of_study int,
    period_id uuid,
    compulsory boolean NOT NULL DEFAULT true,
    elective_group varchar(80),
    prerequisite_course_id uuid REFERENCES courses(id),
    sequence int
);

CREATE TABLE academic_years (
    id uuid PRIMARY KEY,
    name varchar(60) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status varchar(40) NOT NULL DEFAULT 'Planned',
    is_current boolean NOT NULL DEFAULT false
);

CREATE TABLE academic_periods (
    id uuid PRIMARY KEY,
    academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    sequence int NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    registration_open boolean NOT NULL DEFAULT false,
    status varchar(40) NOT NULL DEFAULT 'Planned'
);

CREATE TABLE intakes (
    id uuid PRIMARY KEY,
    code varchar(50) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    application_open date,
    application_close date,
    start_date date,
    status varchar(40) NOT NULL DEFAULT 'Open'
);

-- Admissions and students
CREATE TABLE applicants (
    id uuid PRIMARY KEY,
    application_number varchar(80) NOT NULL UNIQUE,
    first_name varchar(120) NOT NULL,
    last_name varchar(120) NOT NULL,
    date_of_birth date,
    sex varchar(20),
    phone varchar(40),
    email varchar(160),
    address text,
    entry_qualification text
);

CREATE TABLE admissions (
    id uuid PRIMARY KEY,
    applicant_id uuid NOT NULL REFERENCES applicants(id),
    programme_id uuid NOT NULL REFERENCES programmes(id),
    intake_id uuid REFERENCES intakes(id),
    application_date date NOT NULL,
    status varchar(40) NOT NULL DEFAULT 'Submitted',
    decision_date date,
    decision_reason text
);

CREATE TABLE admission_decisions (
    id uuid PRIMARY KEY,
    admission_id uuid NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    decision varchar(40) NOT NULL,
    decided_at_utc timestamptz NOT NULL DEFAULT now(),
    decided_by_user_id uuid REFERENCES users(id),
    notes text
);

CREATE TABLE students (
    id uuid PRIMARY KEY,
    student_number varchar(80) NOT NULL UNIQUE,
    admission_number varchar(80),
    first_name varchar(120) NOT NULL,
    other_names varchar(120),
    last_name varchar(120) NOT NULL,
    date_of_birth date,
    sex varchar(20),
    nationality varchar(80),
    national_id varchar(60),
    phone varchar(40),
    email varchar(160),
    address text,
    disability_status text,
    photo_reference varchar(250),
    status varchar(40) NOT NULL DEFAULT 'Active',
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_guardians (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    full_name varchar(200) NOT NULL,
    relationship varchar(60),
    phone varchar(40),
    email varchar(160),
    address text,
    is_primary boolean NOT NULL DEFAULT false,
    emergency_contact boolean NOT NULL DEFAULT false
);

CREATE TABLE student_enrollments (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    programme_id uuid NOT NULL REFERENCES programmes(id),
    curriculum_id uuid REFERENCES curricula(id),
    intake_id uuid REFERENCES intakes(id),
    admission_date date,
    enrollment_date date,
    expected_completion_date date,
    current_year int,
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE student_academic_statuses (
    id uuid PRIMARY KEY,
    student_enrollment_id uuid NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
    academic_period_id uuid REFERENCES academic_periods(id),
    status varchar(40) NOT NULL,
    recorded_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE course_registrations (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    programme_course_id uuid NOT NULL REFERENCES programme_courses(id),
    academic_period_id uuid NOT NULL REFERENCES academic_periods(id),
    registration_date date NOT NULL,
    attempt_number int NOT NULL DEFAULT 1,
    status varchar(40) NOT NULL DEFAULT 'Registered'
);

CREATE TABLE course_offerings (
    id uuid PRIMARY KEY,
    programme_course_id uuid NOT NULL REFERENCES programme_courses(id),
    academic_period_id uuid NOT NULL REFERENCES academic_periods(id),
    staff_member_id uuid
);

CREATE TABLE teaching_groups (
    id uuid PRIMARY KEY,
    course_offering_id uuid REFERENCES course_offerings(id),
    name varchar(120) NOT NULL
);

CREATE TABLE timetable_entries (
    id uuid PRIMARY KEY,
    course_offering_id uuid REFERENCES course_offerings(id),
    teaching_group_id uuid REFERENCES teaching_groups(id),
    day_of_week int NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    room varchar(80),
    staff_member_id uuid
);

-- Attendance
CREATE TABLE attendance_sessions (
    id uuid PRIMARY KEY,
    course_offering_id uuid REFERENCES course_offerings(id),
    session_date date NOT NULL,
    session_type varchar(40) NOT NULL DEFAULT 'Lecture',
    recorded_by uuid REFERENCES users(id),
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_attendances (
    id uuid PRIMARY KEY,
    attendance_session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id),
    status varchar(40) NOT NULL,
    remarks text
);

CREATE TABLE attendance_records (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    course_registration_id uuid REFERENCES course_registrations(id),
    session_date date NOT NULL,
    session_type varchar(40) NOT NULL DEFAULT 'Lecture',
    status varchar(40) NOT NULL,
    recorded_by uuid REFERENCES users(id),
    remarks text
);

-- Assessment and examinations
CREATE TABLE assessment_weighting_profiles (
    id uuid PRIMARY KEY,
    name varchar(160) NOT NULL,
    regulatory_body varchar(80),
    assessment_model varchar(50),
    effective_from_utc timestamptz,
    effective_to_utc timestamptz,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE assessment_weighting_components (
    id uuid PRIMARY KEY,
    assessment_weighting_profile_id uuid NOT NULL REFERENCES assessment_weighting_profiles(id) ON DELETE CASCADE,
    name varchar(160) NOT NULL,
    assessment_type varchar(80) NOT NULL,
    weight_percentage numeric(5,2),
    maximum_mark numeric(8,2),
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (assessment_weighting_profile_id, name)
);

CREATE TABLE assessment_plans (
    id uuid PRIMARY KEY,
    programme_course_id uuid NOT NULL REFERENCES programme_courses(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    name varchar(160) NOT NULL,
    status varchar(40) NOT NULL DEFAULT 'Draft'
);

CREATE TABLE assessment_plan_weighting_profiles (
    assessment_plan_id uuid NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    assessment_weighting_profile_id uuid NOT NULL REFERENCES assessment_weighting_profiles(id),
    PRIMARY KEY (assessment_plan_id, assessment_weighting_profile_id)
);

CREATE TABLE learning_outcomes (
    id uuid PRIMARY KEY,
    programme_course_id uuid REFERENCES programme_courses(id),
    description text NOT NULL,
    is_competency boolean NOT NULL DEFAULT false
);

CREATE TABLE student_assessments (
    id uuid PRIMARY KEY,
    assessment_plan_id uuid NOT NULL REFERENCES assessment_plans(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id),
    score numeric(8,2),
    grade varchar(10),
    competency_status varchar(40),
    assessor_id uuid REFERENCES staff_members(id),
    published boolean NOT NULL DEFAULT false,
    published_at_utc timestamptz,
    remarks text,
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE results (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    programme_course_id uuid REFERENCES programme_courses(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    total_score numeric(8,2),
    grade varchar(10),
    grade_point numeric(4,2),
    credits_earned int,
    outcome varchar(40),
    status varchar(40) NOT NULL DEFAULT 'Draft',
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE result_approvals (
    id uuid PRIMARY KEY,
    result_id uuid NOT NULL REFERENCES results(id) ON DELETE CASCADE,
    approval_status varchar(40) NOT NULL,
    approved_by uuid REFERENCES users(id),
    approved_at_utc timestamptz,
    notes text
);

CREATE TABLE transcript_entries (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    programme_course_id uuid REFERENCES programme_courses(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    grade varchar(10),
    grade_point numeric(4,2),
    credits int,
    status varchar(40) NOT NULL DEFAULT 'Active',
    display_order int
);

CREATE TABLE academic_result_summaries (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    semester_gpa numeric(4,2),
    cumulative_gpa numeric(4,2),
    credits_attempted int,
    credits_earned int,
    generated_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE student_promotions (
    id uuid PRIMARY KEY,
    student_enrollment_id uuid NOT NULL REFERENCES student_enrollments(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    decision varchar(40) NOT NULL,
    year_from int,
    year_to int,
    decision_date date NOT NULL,
    approved_by uuid REFERENCES users(id),
    remarks text
);

-- Staff
CREATE TABLE staff_members (
    id uuid PRIMARY KEY,
    staff_number varchar(80) NOT NULL UNIQUE,
    first_name varchar(120) NOT NULL,
    last_name varchar(120) NOT NULL,
    email varchar(160),
    phone varchar(40),
    department_id uuid REFERENCES departments(id),
    position varchar(120),
    employment_date date,
    status varchar(40) NOT NULL DEFAULT 'Active',
    user_id uuid REFERENCES users(id)
);

CREATE TABLE teaching_allocations (
    id uuid PRIMARY KEY,
    staff_member_id uuid NOT NULL REFERENCES staff_members(id),
    course_offering_id uuid REFERENCES course_offerings(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    hours_allocated int,
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

-- Clinical / workplace learning
CREATE TABLE placements (
    id uuid PRIMARY KEY,
    name varchar(200) NOT NULL,
    facility_name varchar(200),
    address text,
    supervisor_name varchar(160),
    supervisor_contact varchar(80),
    start_date date,
    end_date date
);

CREATE TABLE student_placements (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    placement_id uuid NOT NULL REFERENCES placements(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    start_date date,
    end_date date,
    status varchar(40) NOT NULL DEFAULT 'Placed',
    assessment_score numeric(5,2),
    remarks text
);

-- Finance
CREATE TABLE fee_structures (
    id uuid PRIMARY KEY,
    programme_id uuid REFERENCES programmes(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    name varchar(200) NOT NULL,
    description text,
    total_amount numeric(18,2) NOT NULL,
    effective_from date,
    effective_to date,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE student_invoices (
    id uuid PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES students(id),
    fee_structure_id uuid REFERENCES fee_structures(id),
    academic_period_id uuid REFERENCES academic_periods(id),
    invoice_number varchar(80) NOT NULL UNIQUE,
    amount numeric(18,2) NOT NULL,
    due_date date,
    status varchar(40) NOT NULL DEFAULT 'Issued',
    issued_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id uuid PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES student_invoices(id),
    amount numeric(18,2) NOT NULL,
    payment_date date NOT NULL,
    method varchar(60),
    reference_number varchar(120),
    received_by uuid REFERENCES users(id),
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

-- Library
CREATE TABLE library_books (
    id uuid PRIMARY KEY,
    isbn varchar(32) NOT NULL UNIQUE,
    title varchar(250) NOT NULL,
    author varchar(200) NOT NULL,
    publisher varchar(200),
    publication_year int,
    category varchar(120),
    copies_total int NOT NULL DEFAULT 1,
    copies_available int NOT NULL DEFAULT 1,
    status varchar(40) NOT NULL DEFAULT 'Available',
    created_at_utc timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE library_loans (
    id uuid PRIMARY KEY,
    book_id uuid NOT NULL REFERENCES library_books(id),
    student_id uuid NOT NULL REFERENCES students(id),
    issued_at_utc timestamptz NOT NULL DEFAULT now(),
    due_date date NOT NULL,
    returned_at_utc timestamptz,
    fine_amount numeric(18,2) NOT NULL DEFAULT 0.00,
    status varchar(40) NOT NULL DEFAULT 'Active'
);

CREATE TABLE librarians (
    id uuid PRIMARY KEY,
    staff_member_id uuid NOT NULL UNIQUE REFERENCES staff_members(id),
    library_role varchar(80) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    assigned_at_utc timestamptz NOT NULL DEFAULT now(),
    deactivated_at_utc timestamptz
);

-- Indexes for common queries
CREATE INDEX ix_students_student_number ON students(student_number);
CREATE INDEX ix_students_status ON students(status);
CREATE INDEX ix_enrollments_student ON student_enrollments(student_id);
CREATE INDEX ix_enrollments_programme ON student_enrollments(programme_id);
CREATE INDEX ix_course_registrations_student ON course_registrations(student_id);
CREATE INDEX ix_course_registrations_period ON course_registrations(academic_period_id);
CREATE INDEX ix_student_attendances_session ON student_attendances(attendance_session_id);
CREATE INDEX ix_student_attendances_student ON student_attendances(student_id);
CREATE INDEX ix_results_student ON results(student_id);
CREATE INDEX ix_transcript_entries_student ON transcript_entries(student_id);
CREATE INDEX ix_student_promotions_enrollment ON student_promotions(student_enrollment_id);
CREATE INDEX ix_library_loans_book ON library_loans(book_id);
CREATE INDEX ix_library_loans_student ON library_loans(student_id);
CREATE INDEX ix_library_loans_status ON library_loans(status);
CREATE INDEX ix_student_invoices_student ON student_invoices(student_id);
CREATE INDEX ix_payments_invoice ON payments(invoice_id);
CREATE INDEX ix_staff_members_department ON staff_members(department_id);
CREATE INDEX ix_teaching_allocations_staff ON teaching_allocations(staff_member_id);
CREATE INDEX ix_admissions_programme ON admissions(programme_id);
CREATE INDEX ix_student_placements_student ON student_placements(student_id);
CREATE INDEX ix_academic_periods_year ON academic_periods(academic_year_id);
CREATE UNIQUE INDEX ix_academic_years_is_current ON academic_years(is_current) WHERE is_current = true;

COMMIT;
