-- Multi-Tenancy Row Level Security Policies
-- Generated: 2026-11-25
-- This migration enables RLS on all tenant-scoped tables and creates isolation policies

BEGIN;

-- Create a function to get the current institution ID from session variable
CREATE OR REPLACE FUNCTION get_current_institution_id()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_institution_id', true)::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has access to institution
CREATE OR REPLACE FUNCTION user_has_institution_access(institution_id uuid)
RETURNS boolean AS $$
BEGIN
    -- In a real implementation, this would check user's institution membership
    -- For now, we rely on the session variable
    RETURN get_current_institution_id() = institution_id;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_academic_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_result_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_application_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Students table policy
CREATE POLICY students_tenant_isolation ON students
    USING (institution_id = get_current_institution_id())
    WITH CHECK (institution_id = get_current_institution_id());

-- Student guardians policy
CREATE POLICY student_guardians_tenant_isolation ON student_guardians
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student enrollments policy
CREATE POLICY student_enrollments_tenant_isolation ON student_enrollments
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student academic statuses policy
CREATE POLICY student_academic_statuses_tenant_isolation ON student_academic_statuses
    USING (student_enrollment_id IN (SELECT id FROM student_enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id())));

-- Course registrations policy
CREATE POLICY course_registrations_tenant_isolation ON course_registrations
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student attendances policy
CREATE POLICY student_attendances_tenant_isolation ON student_attendances
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Attendance records policy
CREATE POLICY attendance_records_tenant_isolation ON attendance_records
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student assessments policy
CREATE POLICY student_assessments_tenant_isolation ON student_assessments
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Results policy
CREATE POLICY results_tenant_isolation ON results
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Result approvals policy
CREATE POLICY result_approvals_tenant_isolation ON result_approvals
    USING (result_id IN (SELECT id FROM results WHERE student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id())));

-- Transcript entries policy
CREATE POLICY transcript_entries_tenant_isolation ON transcript_entries
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Academic result summaries policy
CREATE POLICY academic_result_summaries_tenant_isolation ON academic_result_summaries
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student promotions policy
CREATE POLICY student_promotions_tenant_isolation ON student_promotions
    USING (student_enrollment_id IN (SELECT id FROM student_enrollments WHERE student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id())));

-- Library loans policy
CREATE POLICY library_loans_tenant_isolation ON library_loans
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Student invoices policy
CREATE POLICY student_invoices_tenant_isolation ON student_invoices
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Payments policy
CREATE POLICY payments_tenant_isolation ON payments
    USING (invoice_id IN (SELECT id FROM student_invoices WHERE student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id())));

-- Student placements policy
CREATE POLICY student_placements_tenant_isolation ON student_placements
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Staff members policy
CREATE POLICY staff_members_tenant_isolation ON staff_members
    USING (department_id IN (SELECT id FROM departments WHERE faculty_id IN (SELECT id FROM faculties WHERE institution_id = get_current_institution_id())))
    WITH CHECK (department_id IN (SELECT id FROM departments WHERE faculty_id IN (SELECT id FROM faculties WHERE institution_id = get_current_institution_id())));

-- Teaching allocations policy
CREATE POLICY teaching_allocations_tenant_isolation ON teaching_allocations
    USING (staff_member_id IN (SELECT id FROM staff_members WHERE department_id IN (SELECT id FROM departments WHERE faculty_id IN (SELECT id FROM faculties WHERE institution_id = get_current_institution_id()))));

-- Leave requests policy
CREATE POLICY leave_requests_tenant_isolation ON leave_requests
    USING (staff_member_id IN (SELECT id FROM staff_members WHERE department_id IN (SELECT id FROM departments WHERE faculty_id IN (SELECT id FROM faculties WHERE institution_id = get_current_institution_id()))));

-- Gate logs policy
CREATE POLICY gate_logs_tenant_isolation ON gate_logs
    USING (institution_id = get_current_institution_id())
    WITH CHECK (institution_id = get_current_institution_id());

-- Gate passes policy
CREATE POLICY gate_passes_tenant_isolation ON gate_passes
    USING (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()))
    WITH CHECK (student_id IN (SELECT id FROM students WHERE institution_id = get_current_institution_id()));

-- Audit logs policy
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (institution_id = get_current_institution_id())
    WITH CHECK (institution_id = get_current_institution_id());

-- Users policy (users can only see users in their institution)
CREATE POLICY users_tenant_isolation ON users
    USING (id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name LIKE '%' || get_current_institution_id() || '%'))
    WITH CHECK (id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name LIKE '%' || get_current_institution_id() || '%'));

-- User roles policy
CREATE POLICY user_roles_tenant_isolation ON user_roles
    USING (user_id IN (SELECT id FROM users WHERE id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name LIKE '%' || get_current_institution_id() || '%')));

-- Grant usage on the functions
GRANT EXECUTE ON FUNCTION get_current_institution_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_has_institution_access(uuid) TO PUBLIC;

-- Create indexes to support RLS policies
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_department_institution ON staff_members(department_id) INCLUDE (id) WHERE department_id IS NOT NULL;
-- Note: Composite indexes for subqueries would be more complex

COMMIT;