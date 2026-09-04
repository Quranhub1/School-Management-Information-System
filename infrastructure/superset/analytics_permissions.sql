-- Run once as a PostgreSQL administrator/owner of school_management.
-- Example:
--   psql -d school_management --set=analytics_password="$SMIS_ANALYTICS_DB_PASSWORD" -f analytics_permissions.sql

CREATE ROLE smis_analytics LOGIN PASSWORD :'analytics_password';

GRANT CONNECT ON DATABASE school_management TO smis_analytics;
GRANT USAGE ON SCHEMA analytics TO smis_analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO smis_analytics;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics
  GRANT SELECT ON TABLES TO smis_analytics;

-- The analytics role intentionally receives no permissions on the transactional tables.
