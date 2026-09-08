# Running the SMIS Backend

This file is the backend-specific quick reference. For the complete installation of PostgreSQL, API, frontend, LAN deployment, native Windows client, installer, backups, security and end-to-end acceptance testing, use [`INSTALLATION.md`](INSTALLATION.md).

## 1. Quick mock-backend testing

The mock server can be used for UI smoke testing without .NET/PostgreSQL:

```bash
cd backend/mock-server
npm install
npm start
```

It normally runs at `http://localhost:5000`.

Start the frontend in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The mock server is not a production backend and must not be used for institutional records.

## 2. Real backend prerequisites

- .NET 8 SDK
- PostgreSQL 15/16 recommended
- Git
- Node.js 24/npm for the frontend

## 3. PostgreSQL

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create a dedicated application role/database. Never commit the production password.

Example:

```sql
CREATE USER smis_app WITH PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
CREATE DATABASE school_management OWNER smis_app;
GRANT ALL PRIVILEGES ON DATABASE school_management TO smis_app;
```

## 4. API configuration

Project:

```text
backend/src/SchoolManagement.Api
```

Recommended production environment variables:

```bash
export ConnectionStrings__SchoolManagement='Host=localhost;Port=5432;Database=school_management;Username=smis_app;Password=REPLACE_ME'
export Authentication__JwtKey='REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS'
export ASPNETCORE_ENVIRONMENT='Production'
```

The institutional currency is **UGX (Ugandan Shilling)**.

## 5. Database migration

From `backend/`:

```bash
dotnet restore
dotnet ef database update --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
```

Install EF tooling if required:

```bash
dotnet tool install --global dotnet-ef --version 8.*
```

Review migrations before applying them to production.

## 6. Build/test/run

```bash
cd backend
dotnet build SchoolManagement.sln --configuration Release
dotnet test SchoolManagement.sln --configuration Release
cd src/SchoolManagement.Api
dotnet run
```

Health endpoint:

```text
/api/health
```

Swagger is available when enabled by the environment.

## 7. Administrator bootstrap

In a controlled development/bootstrap database, create a System Administrator using the registration endpoint if registration is enabled:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"REPLACE_WITH_A_STRONG_PASSWORD","firstName":"System","lastName":"Administrator","roles":["SystemAdministrator"]}'
```

The development seed may provide `admin` / `admin123` where that seed is enabled. This credential is **development-only** and must be changed before production deployment.

## 8. Frontend connection

```bash
cd frontend
npm ci
npm run build
npm run dev
```

If the API is hosted on a different origin, configure the frontend's supported Vite API-base environment setting for that environment.

## 9. Production service

Publish:

```bash
cd backend/src/SchoolManagement.Api
dotnet publish -c Release -o /opt/schoolmanagement/api
```

A systemd service should execute:

```text
/usr/bin/dotnet /opt/schoolmanagement/api/SchoolManagement.Api.dll
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now schoolmanagement.service
sudo systemctl status schoolmanagement.service
```

## 10. Full acceptance path

Do not use production data for acceptance testing. Use a dedicated test database.

The required golden-path test student is:

- **Name:** Kaigwa Akram
- **Assessment/admission number:** `U075/042`
- **Test admission/reporting date:** `2026-09-09`

Verify the complete path:

```text
Administrator login
→ institution/academic structure
→ application/admission
→ acceptance/decision
→ admission
→ enrollment
→ course registration
→ UGX billing
→ installment schedule
→ payment 1
→ payment allocation/balance
→ payment 2/final installment as applicable
→ ledger/report verification
→ attendance
→ assessment/results
→ student profile/360
→ audit/reporting
```

Also create a second test user with restricted permissions, log in as that user, verify permitted screens, verify restricted operations are rejected, then deactivate/delete the test account as appropriate.

## 11. Troubleshooting

### PostgreSQL connection failure

```bash
sudo systemctl status postgresql
sudo journalctl -u schoolmanagement.service -n 200
```

Check the database name, role, password, host, port and migration history.

### Frontend/API mismatch

Verify the configured API origin, CORS policy, HTTPS certificate and `/api/health`.

### Authentication failure

Verify the user exists, the password is correct, the account is active, the JWT key is configured, and the user has the required role/policy.

### Migration failure

Do not delete/reset a production database. Capture the exact error, inspect migration history/schema state, and correct the migration safely.

## 12. Production security

- Replace all development/default credentials.
- Keep JWT/database secrets out of Git.
- Use HTTPS.
- Do not expose PostgreSQL directly to clients.
- Back up PostgreSQL and test restores.
- Review audit logs.
- Verify authorization server-side for sensitive operations.

See [`INSTALLATION.md`](INSTALLATION.md) for the complete release checklist.