-- Initial database setup for School Management Information System
-- This runs automatically when the PostgreSQL container starts for the first time.

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The application will create all tables via Entity Framework Core migrations.
-- This script is only for initial setup and any manual reference data.

-- Optionally, create a read-only reporting role (application-managed)
-- CREATE ROLE smis_reporting WITH LOGIN PASSWORD 'reporting_password';
-- GRANT CONNECT ON DATABASE school_management TO smis_reporting;
-- GRANT USAGE ON SCHEMA public TO smis_reporting;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO smis_reporting;
