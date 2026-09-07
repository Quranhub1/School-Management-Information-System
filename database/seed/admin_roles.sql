-- Seed initial institutional roles
-- Run after 0001_InitialCreate.sql

INSERT INTO roles (id, name, description) VALUES
    (gen_random_uuid(), 'System Administrator', 'Full system access and configuration'),
    (gen_random_uuid(), 'Principal', 'Institutional leadership and oversight'),
    (gen_random_uuid(), 'Registrar', 'Academic registry and records management'),
    (gen_random_uuid(), 'Academic Registrar', 'Academic operations and curriculum'),
    (gen_random_uuid(), 'Admissions Officer', 'Application and admission processing'),
    (gen_random_uuid(), 'Head of Faculty', 'Faculty/school leadership'),
    (gen_random_uuid(), 'Head of Department', 'Department leadership'),
    (gen_random_uuid(), 'Academic Officer', 'Academic programme coordination'),
    (gen_random_uuid(), 'Examinations Officer', 'Examination and assessment administration'),
    (gen_random_uuid(), 'Lecturer', 'Teaching and assessment delivery'),
    (gen_random_uuid(), 'Clinical Supervisor', 'Clinical/workplace placement supervision'),
    (gen_random_uuid(), 'Finance Officer', 'Financial management and billing'),
    (gen_random_uuid(), 'Cashier', 'Payment collection and receipting'),
    (gen_random_uuid(), 'Librarian', 'Library management and circulation'),
    (gen_random_uuid(), 'Student Affairs', 'Student welfare and support'),
    (gen_random_uuid(), 'HR Manager', 'Staff and human resource management'),
    (gen_random_uuid(), 'Student', 'Student self-service access'),
    (gen_random_uuid(), 'Parent', 'Guardian/parent self-service access')
ON CONFLICT (name) DO NOTHING;
