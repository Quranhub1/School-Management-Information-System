# Testing Readiness

## Current deployment target

- Ubuntu server hosts the SMIS backend and PostgreSQL database.
- Client computers access the application over the school LAN using the server address.
- KOHA and DSpace remain external services and are configured through `Library:Integrations:KohaBaseUrl` and `Library:Integrations:DSpaceBaseUrl`.

## Pre-test verification

1. Restore and build `SchoolManagement.sln` in Release configuration.
2. Apply EF Core migrations to the test PostgreSQL database.
3. Seed the administrator account and required reference data.
4. Start the SMIS API as a systemd service.
5. Verify health/authentication endpoints from the server itself.
6. Verify login and major modules from at least one LAN client.
7. Configure and test KOHA and DSpace endpoints separately.
8. Record any functional defects found during physical testing.
