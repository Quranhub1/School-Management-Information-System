-- SMIS analytics layer for Apache Superset.
-- These views intentionally expose reporting-friendly fields instead of the full
-- transactional schema. Run this script against the school_management database
-- using the normal application database owner.

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE OR REPLACE VIEW analytics.student_overview AS
SELECT
    s."Id" AS student_id,
    s."StudentNumber" AS student_number,
    s."Gender" AS gender,
    s."Status" AS student_status,
    s."CreatedAt" AS created_at
FROM "Students" s;

CREATE OR REPLACE VIEW analytics.enrollment_fact AS
SELECT
    e."Id" AS enrollment_id,
    e."StudentId" AS student_id,
    s."StudentNumber" AS student_number,
    s."Gender" AS gender,
    s."Status" AS student_status,
    e."ProgrammeId" AS programme_id,
    p."Code" AS programme_code,
    p."Name" AS programme_name,
    p."Award" AS award,
    p."StudyMode" AS study_mode,
    p."DeliveryType" AS delivery_type,
    d."Code" AS department_code,
    d."Name" AS department_name,
    e."AdmissionDate" AS admission_date,
    e."Status" AS enrollment_status,
    e."CurrentYear" AS current_year
FROM "StudentEnrollments" e
JOIN "Students" s ON s."Id" = e."StudentId"
JOIN "Programmes" p ON p."Id" = e."ProgrammeId"
JOIN "Departments" d ON d."Id" = p."DepartmentId";

CREATE OR REPLACE VIEW analytics.attendance_fact AS
SELECT
    sa."Id" AS attendance_id,
    sa."StudentId" AS student_id,
    s."StudentNumber" AS student_number,
    s."Gender" AS gender,
    s."Status" AS student_status,
    ast."Id" AS session_id,
    ast."SessionDate" AS session_date,
    ast."Status" AS session_status,
    sa."Status" AS attendance_status,
    sa."Remarks" AS remarks
FROM "StudentAttendances" sa
JOIN "Students" s ON s."Id" = sa."StudentId"
JOIN "AttendanceSessions" ast ON ast."Id" = sa."AttendanceSessionId";

CREATE OR REPLACE VIEW analytics.payment_fact AS
SELECT
    p."Id" AS payment_id,
    p."StudentInvoiceId" AS invoice_id,
    i."StudentId" AS student_id,
    s."StudentNumber" AS student_number,
    p."ReceiptNumber" AS receipt_number,
    p."Amount" AS amount,
    p."Currency" AS currency,
    p."PaymentMethod" AS payment_method,
    p."PaidAt" AS paid_at,
    i."Amount" AS invoice_amount,
    i."PaidAmount" AS invoice_paid_amount,
    i."Status" AS invoice_status
FROM "Payments" p
JOIN "StudentInvoices" i ON i."Id" = p."StudentInvoiceId"
JOIN "Students" s ON s."Id" = i."StudentId";

CREATE OR REPLACE VIEW analytics.invoice_fact AS
SELECT
    i."Id" AS invoice_id,
    i."StudentId" AS student_id,
    s."StudentNumber" AS student_number,
    i."InvoiceNumber" AS invoice_number,
    i."Amount" AS amount,
    i."PaidAmount" AS paid_amount,
    GREATEST(i."Amount" - i."PaidAmount", 0) AS outstanding_amount,
    i."Currency" AS currency,
    i."Status" AS invoice_status,
    i."IssuedAt" AS issued_at
FROM "StudentInvoices" i
JOIN "Students" s ON s."Id" = i."StudentId";

CREATE OR REPLACE VIEW analytics.admission_fact AS
SELECT
    a."Id" AS applicant_id,
    a."ApplicationNumber" AS application_number,
    a."Gender" AS gender,
    a."Status" AS application_status,
    a."AppliedAt" AS applied_at
FROM "Applicants" a;

CREATE OR REPLACE VIEW analytics.library_loan_fact AS
SELECT
    l."Id" AS loan_id,
    l."BookId" AS book_id,
    l."StudentId" AS student_id,
    s."StudentNumber" AS student_number,
    l."IssuedAtUtc" AS issued_at_utc,
    l."DueAtUtc" AS due_at_utc,
    l."ReturnedAtUtc" AS returned_at_utc,
    l."FineAmount" AS fine_amount,
    (l."ReturnedAtUtc" IS NULL) AS is_active,
    (l."ReturnedAtUtc" IS NULL AND CURRENT_TIMESTAMP > l."DueAtUtc") AS is_overdue
FROM "LibraryLoans" l
JOIN "Students" s ON s."Id" = l."StudentId";

COMMENT ON SCHEMA analytics IS 'Read-only reporting views for Apache Superset';
