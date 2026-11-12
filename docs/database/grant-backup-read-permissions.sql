-- SMIS pg_dump read permissions
-- Run with psql as a PostgreSQL administrator while connected to school_management.
-- Change backup_role below if the connection string uses a different database role.
\set ON_ERROR_STOP on
\set backup_role 'school_management'

GRANT CONNECT ON DATABASE school_management TO :"backup_role";
GRANT USAGE ON SCHEMA public TO :"backup_role";

-- Existing tables and sequences (including PaymentAllocations).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"backup_role";
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO :"backup_role";

-- Keep future tables/sequences readable by the backup role for every role
-- that currently owns objects in public. Re-run this script if a new
-- migration-owner role is introduced later.
SELECT format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT ON TABLES TO %I',
    owners.role_name,
    :'backup_role'
)
FROM (
    SELECT DISTINCT pg_get_userbyid(c.relowner) AS role_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
) AS owners
\gexec

SELECT format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT ON SEQUENCES TO %I',
    owners.role_name,
    :'backup_role'
)
FROM (
    SELECT DISTINCT pg_get_userbyid(c.relowner) AS role_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
) AS owners
\gexec

-- Verify the reported failing table specifically.
SELECT
    :'backup_role' AS backup_role,
    has_table_privilege(
        :'backup_role',
        'public."PaymentAllocations"',
        'SELECT'
    ) AS can_read_payment_allocations;
