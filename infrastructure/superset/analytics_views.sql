-- SMIS analytics layer for Apache Superset.
-- These views intentionally expose reporting-friendly fields instead of the full
-- transactional schema. Run this script against the school_management database
-- using the normal application database owner.

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE OR REPLACE VIEW analytics.student_overview AS
SELECT
    s.id AS student_id,
    s.student_number AS student_number,
    s.sex AS gender,
    s.status AS student_status,
    s.created_at_utc AS created_at
FROM students s;

CREATE OR REPLACE VIEW analytics.enrollment_fact AS
SELECT
    e.id AS enrollment_id,
    e.student_id AS student_id,
    s.student_number AS student_number,
    s.sex AS gender,
    s.status AS student_status,
    e.programme_id AS programme_id,
    p.code AS programme_code,
    p.name AS programme_name,
    p.award_type AS award,
    p.study_mode AS study_mode,
    p.delivery_type AS delivery_type,
    d.code AS department_code,
    d.name AS department_name,
    e.admission_date AS admission_date,
    e.status AS enrollment_status,
    e.current_year AS current_year
FROM student_enrollments e
JOIN students s ON s.id = e.student_id
JOIN programmes p ON p.id = e.programme_id
JOIN departments d ON d.id = p.department_id;

CREATE OR REPLACE VIEW analytics.attendance_fact AS
SELECT
    sa.id AS attendance_id,
    sa.student_id AS student_id,
    s.student_number AS student_number,
    s.sex AS gender,
    s.status AS student_status,
    ast.id AS session_id,
    ast.session_date AS session_date,
    ast.session_type AS session_status,
    sa.status AS attendance_status,
    sa.remarks AS remarks
FROM student_attendances sa
JOIN students s ON s.id = sa.student_id
JOIN attendance_sessions ast ON ast.id = sa.attendance_session_id;

CREATE OR REPLACE VIEW analytics.payment_fact AS
SELECT
    p.id AS payment_id,
    p.student_invoice_id AS invoice_id,
    i.student_id AS student_id,
    s.student_number AS student_number,
    p.receipt_number AS receipt_number,
    p.amount AS amount,
    p.currency AS currency,
    p.payment_method AS payment_method,
    p.payment_date AS paid_at,
    i.amount AS invoice_amount,
    i.status AS invoice_status
FROM payments p
JOIN student_invoices i ON i.id = p.student_invoice_id
JOIN students s ON s.id = i.student_id;

CREATE OR REPLACE VIEW analytics.invoice_fact AS
SELECT
    i.id AS invoice_id,
    i.student_id AS student_id,
    s.student_number AS student_number,
    i.invoice_number AS invoice_number,
    i.amount AS amount,
    GREATEST(i.amount - i.paid_amount, 0) AS outstanding_amount,
    i.currency AS currency,
    i.status AS invoice_status,
    i.issued_at_utc AS issued_at
FROM student_invoices i
JOIN students s ON s.id = i.student_id;

CREATE OR REPLACE VIEW analytics.admission_fact AS
SELECT
    a.id AS applicant_id,
    a.application_number AS application_number,
    a.sex AS gender,
    a.status AS application_status,
    a.application_date AS applied_at
FROM applicants a;

CREATE OR REPLACE VIEW analytics.library_loan_fact AS
SELECT
    l.id AS loan_id,
    l.book_id AS book_id,
    l.student_id AS student_id,
    s.student_number AS student_number,
    l.due_date AS due_date,
    l.returned_at_utc AS returned_at_utc,
    l.fine_amount AS fine_amount,
    (l.returned_at_utc IS NULL) AS is_active,
    (l.returned_at_utc IS NULL AND CURRENT_TIMESTAMP > l.due_date) AS is_overdue
FROM library_loans l
JOIN students s ON s.id = l.student_id;

COMMENT ON SCHEMA analytics IS 'Read-only reporting views for Apache Superset';
