# School Management Information System — Complete Installation Guide

This guide is the operational installation reference for the full SMIS stack: PostgreSQL, ASP.NET Core API, React frontend, LAN deployment, native Windows desktop client, Windows installer, and optional Ubuntu client.

## 1. System architecture

```text
Windows/Linux clients
        │
        │ HTTPS / LAN
        ▼
Nginx (optional production reverse proxy)
        │
        ▼
ASP.NET Core 8 API
        │
        ▼
PostgreSQL
```

The native Windows client is a desktop shell around the approved SMIS web application/API origin. The Windows installer is produced by Tauri and uses the approved SMIS `icon.png` as its application/installer icon.

## 2. Supported production baseline

### Server

- Ubuntu Server 22.04/24.04 LTS recommended
- .NET 8 SDK/runtime
- PostgreSQL 15/16 recommended
- Nginx for HTTPS and LAN reverse proxy
- Git
- Node.js 24 + npm for frontend builds

### Windows client

- Windows 10/11
- x64 recommended
- x86 installer is also produced where supported
- WebView2 is required by the native desktop shell unless the packaged desktop build supplies an equivalent runtime

### Development workstation

- Git
- .NET 8 SDK
- Node.js 24
- npm
- PostgreSQL
- Rust toolchain for Tauri desktop builds

## 3. Clone the repository

```bash
git clone https://github.com/Quranhub1/School-Management-Information-System.git
cd School-Management-Information-System
```

Always build from `main` or a tagged release. Do not deploy an arbitrary feature branch.

## 3A. One-command dependency installation

From the repository root, run the appropriate setup script. It restores the complete declared dependency graph for both application tiers.

Windows PowerShell:
```powershell
.\setup.ps1
```

Ubuntu/Linux:
```bash
bash ./setup.sh
```

The scripts require Node.js 24+ and the .NET 8 SDK (or newer compatible major versions), run `npm ci` using the committed lockfile, and run `dotnet restore` for `backend/SchoolManagement.sln`. The frontend's direct dependencies—including Zod, AG Grid, Chart.js and the bundled font packages—are installed together with all transitive dependencies from the lockfile.

To update a clean checkout and immediately restore dependencies:

- Windows: `./update.ps1`
- Linux: `bash ./update.sh`

The update helpers use fast-forward-only Git pulls and refuse to proceed with uncommitted changes. A plain `git pull` cannot itself guarantee dependency installation; use the update helper or run the setup script after pulling. Package downloads require access to npm and NuGet feeds unless the packages are already cached or served by an internal mirror.

## 4. PostgreSQL installation

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql
```

Create the application database and account using credentials appropriate for the institution. Do not commit production passwords to Git.

Example:

```sql
CREATE USER smis_app WITH PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
CREATE DATABASE school_management OWNER smis_app;
GRANT ALL PRIVILEGES ON DATABASE school_management TO smis_app;
```

For PostgreSQL 15/16, ensure the application role can create/use the required schema objects during migrations.

## 5. Backend configuration

The API project is:

`backend/src/SchoolManagement.Api`

Configure the database and JWT signing key using environment variables in production:

```bash
export ConnectionStrings__SchoolManagement='Host=localhost;Port=5432;Database=school_management;Username=smis_app;Password=REPLACE_ME'
export Authentication__JwtKey='REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS'
export ASPNETCORE_ENVIRONMENT='Production'
```

The system currency defaults to **UGX — Ugandan Shilling**. A System Administrator can change it under **System Administration → System settings → System currency**. Supported choices include UGX, USD, KES, EUR, GBP, TZS, RWF, ZAR and AED. The selected currency is the default for new records; existing transactions retain their recorded currency and are never automatically converted.

## 6. Apply EF Core migrations

From the repository root:

```bash
cd backend
dotnet restore
dotnet ef database update --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
```

If `dotnet ef` is not installed:

```bash
dotnet tool install --global dotnet-ef --version 8.*
```

Before production rollout, inspect the generated migration SQL and verify that the migration history is complete. Never reset a production database just to make a migration pass.

## 7. Build and run the API

```bash
cd backend
dotnet build SchoolManagement.sln
dotnet test SchoolManagement.sln
cd src/SchoolManagement.Api
dotnet run
```

The development API is normally exposed on the ports defined by the project launch configuration. Swagger is available when enabled by the environment.

Health check:

```text
/health
```

## 8. Create the first administrator

Use the authentication registration endpoint only in a controlled development/bootstrap environment. The administrator must receive the System Administrator role so that the administration screens and authorization policies can be exercised.

Example bootstrap request:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"REPLACE_WITH_A_STRONG_PASSWORD","firstName":"System","lastName":"Administrator","roles":["SystemAdministrator"]}'
```

For a test/development environment, the seeder creates `admin` with the deterministic password `admin123` when `SEED_ADMIN_PASSWORD` is not supplied. You can override it by setting `SEED_ADMIN_PASSWORD` before startup. **Production does not use this fallback: `SEED_ADMIN_PASSWORD` is required and must be at least 12 characters. Never expose or retain the development password in production.**

## 9. Frontend installation and production LAN hosting

The frontend is under `frontend/`. Install dependencies and build the production web bundle:

```powershell
cd frontend
npm ci
npm run build:lan
```

`npm run build:lan` runs the normal frontend checks (offline-login check, tests and TypeScript), creates a Vite production build with root-relative asset URLs, and copies the generated `dist/` files into `backend/src/SchoolManagement.Api/wwwroot/`. The ASP.NET Core API serves the React application and API from the same origin. The copy script replaces the API's existing `wwwroot` directory, so keep any intentional server-owned static files outside that directory.

For local development only:

```powershell
npm run dev
```

The Vite development server remains on port 5173 and proxies `/api` to `http://127.0.0.1:5000`. Do not use Vite's development server as the school-wide production host.

## 10. Full local development startup

Terminal 1 — PostgreSQL:

```bash
sudo systemctl start postgresql
```

Terminal 2 — API:

```bash
cd backend/src/SchoolManagement.Api
dotnet run
```

Terminal 3 — frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the frontend in the development browser URL shown by Vite and log in with the configured administrator account.

## 11. Production server deployment

On the build workstation, create the production web bundle first:

```powershell
cd frontend
npm ci
npm run build:lan
```

Then publish the API, which now includes the copied React assets under `wwwroot`:

```powershell
cd ../backend/src/SchoolManagement.Api
dotnet publish -c Release -o /opt/schoolmanagement/api
```

Set `ASPNETCORE_ENVIRONMENT=Production`, a strong `Authentication__JwtKey`, the production PostgreSQL connection string, `SEED_ADMIN_PASSWORD`, and the attendance QR secret through the service environment or secret manager. Never put real secrets in the repository. The default listener is `http://0.0.0.0:5000`; use `http://127.0.0.1:5000` on the host PC and `http://HOST-PC-LAN-IP:5000` from other trusted school computers.

The web root serves static frontend files without authentication; API endpoints retain their configured authentication and authorization. SPA deep links fall back to `index.html`, while unknown `/api` routes remain API 404 responses. Same-origin hosting does not require CORS. If a separately hosted client must call the API, configure its exact origin in `AllowedOrigins__0` (and subsequent indexed entries).

### Windows LAN host quick start

On the Windows host PC, from the repository root after dependencies are installed:

```powershell
cd .\frontend
npm ci
npm run build:lan

cd ..\backend
dotnet publish .\src\SchoolManagement.Api\SchoolManagement.Api.csproj -c Release -o ..\publish\api
```

Set the production environment in the PowerShell session that starts the published API. Supply the real existing PostgreSQL password and strong secrets locally; do not paste them into Git or share them in chat:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:ASPNETCORE_URLS = "http://0.0.0.0:5000"
$env:ConnectionStrings__SchoolManagement = "Host=localhost;Port=5432;Database=school_management;Username=school_management;Password=<YOUR_LOCAL_DB_PASSWORD>"
$env:Authentication__JwtKey = "<YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS>"
$env:SEED_ADMIN_PASSWORD = "<YOUR_STRONG_ADMIN_BOOTSTRAP_PASSWORD>"
$env:Security__AttendanceQrSecret = "<YOUR_LONG_RANDOM_ATTENDANCE_SECRET>"
cd ..\publish\api
dotnet .\SchoolManagement.Api.dll
```

Keep this PowerShell window/service running. Open `http://127.0.0.1:5000` on the host PC and `http://HOST-PC-LAN-IP:5000` on school clients. The first Production startup applies pending EF migrations and seeds required records; take a verified database backup before the first production startup. Do not use placeholder values literally.

Create a systemd service similar to:

```ini
[Unit]
Description=School Management Information System API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/schoolmanagement/api
ExecStart=/usr/bin/dotnet /opt/schoolmanagement/api/SchoolManagement.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ConnectionStrings__SchoolManagement=Host=localhost;Port=5432;Database=school_management;Username=smis_app;Password=REPLACE_ME
Environment=Authentication__JwtKey=REPLACE_ME

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now schoolmanagement.service
sudo systemctl status schoolmanagement.service
journalctl -u schoolmanagement.service -f
```

## 12. LAN deployment and network addressing

For a simple single-server school LAN deployment, the ASP.NET Core service can serve both the production React frontend and `/api` on TCP port `5000`. Nginx remains an optional reverse proxy when the institution is ready to configure a trusted HTTPS certificate and DNS name.

Reserve the host PC's LAN IPv4 address in the router's DHCP settings before distributing the URL to client computers. The reservation must use the host PC's active Ethernet/Wi-Fi adapter MAC address and an unused address in the router's LAN subnet. This router task is intentionally **not completed by the repository change**: it requires access to the actual router administration interface and confirmation of the active adapter and DHCP scope. See `docs/LAN_HOST_SETUP.md`.

Allow inbound TCP port `5000` only from the trusted Private/school LAN in the host firewall. Do not expose PostgreSQL (normally TCP 5432) to client machines or expose port 5000 on the public/WAN interface. For production use with sensitive student and staff data, plan HTTPS on the LAN; plain HTTP is a connectivity baseline, not transport encryption.

## 13. Native Windows desktop client

The native client is under `frontend/src-tauri/`.

Install the Rust toolchain and then:

```bash
cd frontend
npm ci
npx @tauri-apps/cli@2.8.4 build --target x86_64-pc-windows-msvc --bundles nsis
```

The repository workflow also builds x86 (`i686-pc-windows-msvc`) and x64 Windows installers.

## 14. Windows installer and icon

The approved application icon is:

```text
frontend/public/icon.png
```

It must remain named exactly `icon.png` and must not be replaced by a generated placeholder.

The Tauri build converts the approved PNG into the Windows icon assets, including `icon.ico`. The Windows installer is an NSIS `.exe`, so Windows Explorer can display the SMIS icon directly on the installer file, just like a normal installed Windows program.

Expected distribution:

```text
SMIS-Setup.exe       ← installer itself displays the SMIS icon
        │
        └── install
              │
              ├── SMIS application       ← SMIS icon
              ├── Start Menu shortcut    ← SMIS icon
              └── Desktop shortcut       ← SMIS icon
```

The installer can be copied to a flash disk. The icon is embedded into the packaged executable; `icon.png` does not need to accompany the installer on the flash disk.

## 15. GitHub Release installation

The Windows installer workflow is intended to build the NSIS installer and publish the resulting `.exe` files as release assets. After a successful tagged release build, download the appropriate x64 or x86 installer from the GitHub Release Assets and copy it to the deployment flash disk.

Do not distribute an installer from a failed or unverified Actions run.

## 16. First-run server connection

The production desktop client must point to the institution's trusted HTTPS SMIS origin. Verify:

1. Server is reachable from the client LAN.
2. DNS resolves correctly.
3. HTTPS certificate is valid.
4. `/health` responds successfully.
5. Login succeeds.
6. Administrator authorization loads the administration workspace.
7. Non-administrator users receive only their authorized modules.

## 17. Initial institutional setup

After administrator login, configure these in dependency order:

1. Institution
2. Campus/site
3. Faculty/school/directorate
4. Department/unit
5. Academic year
6. Semester/term/block
7. Intake
8. Programme
9. Curriculum version
10. Courses/units
11. Programme-course mapping
12. Admission requirements
13. Staff and lecturer records
14. User accounts and roles
15. Fee structure/chart of accounts
16. Payment methods and finance configuration
17. Classes/groups where required
18. Timetable
19. Attendance settings
20. Hostel/transport structures if used
21. Library configuration if used

Only after the academic structure exists should admissions and enrollment be exercised.

## 18. End-to-end acceptance test

Use a dedicated **test database**, never the production database, for this scenario.

Test student:

- Name: Kaigwa Akram
- Assessment/admission number: `U075/042`
- Admission date/reporting date: `2026-09-09`

Golden path:

```text
Admin login
→ create/verify institutional structure
→ create admission/application
→ accept admission decision
→ admit student
→ create enrollment
→ register courses
→ generate fee/invoice charges in UGX
→ create installment schedule
→ post first installment payment
→ verify allocation/outstanding balance
→ post subsequent installment payment(s)
→ verify fully/partially paid status
→ record attendance
→ enter assessment marks
→ calculate/verify results
→ inspect student 360/profile
→ verify finance ledger and reports
→ verify audit trail
```

Each step must be checked for both successful completion and correct authorization. The test must not use a real production student record.

## 19. Administrator and user-account acceptance test

After administrator login:

1. Create a second test user.
2. Assign a deliberately limited role.
3. Log in as that user.
4. Confirm permitted screens load and actions work.
5. Confirm restricted administration/finance actions are rejected.
6. Return to the administrator account.
7. Modify/deactivate the test account.
8. Confirm the authorization change takes effect.

Do not reuse the same password for production users.

## 20. Screen/module smoke test

The final acceptance pass must open every enabled module and verify that the first load, list/table, create/edit workflow where applicable, validation, save, search/filter and navigation work without an unhandled exception.

Modules include:

- Dashboard
- Identity/authentication
- Administration
- Institution/campus/faculty/department
- Academic structure
- Programmes/curriculum/courses
- Admissions
- Students
- Enrollment/registration
- Assessment
- Examinations/results/transcripts
- Attendance/QR attendance
- Staff/HR/payroll/leave
- Finance/fees/payments/installments/ledger/journal/reports
- Hostel
- Transport
- Library
- Clinical/workplace learning
- Certificates/graduation/alumni
- Documents
- Communications/notices/messages
- Analytics/reporting
- System administration/audit

## 21. Automated verification

Before release:

```bash
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln --configuration Release
dotnet test SchoolManagement.sln --configuration Release

cd ../frontend
npm ci
npm run build
```

Then run the GitHub Actions workflows and require successful results before publishing the installer.

## 22. Backups and recovery

Back up PostgreSQL before production migration and on a scheduled basis. A backup is not considered valid until a restore has been tested on a separate database/server.

Example logical backup:

```bash
pg_dump -Fc -d school_management -f school_management.backup
```

Example restore to a test database:

```bash
createdb school_management_restore
pg_restore -d school_management_restore school_management.backup
```

## 23. Production security checklist

- Replace all development/default passwords.
- Use a strong JWT signing key stored outside Git.
- Use HTTPS for all production client traffic.
- Do not expose PostgreSQL directly to client machines.
- Restrict administrator accounts to authorized staff.
- Enable backups and test restores.
- Review audit logs.
- Keep the OS, .NET runtime, Node/Rust build dependencies and PostgreSQL patched.
- Do not run destructive database resets against production.
- Validate authorization, not merely UI visibility, for sensitive operations.

## 24. Troubleshooting

### API cannot connect to PostgreSQL

Check:

```bash
sudo systemctl status postgresql
sudo journalctl -u schoolmanagement.service -n 200
```

Then verify the connection string and PostgreSQL role/database.

### Frontend loads but API calls fail

Check the API origin, CORS configuration, HTTPS certificate, browser/network console and `/api/health`.

### Installer has no icon

Verify that the approved `frontend/public/icon.png` exists, that the Tauri icon generation step runs before packaging, and that the generated `frontend/src-tauri/icons/icon.ico` is included in the Windows bundle configuration. Rebuild the installer; do not manually rename an unrelated icon file.

### Windows client cannot connect

Verify server URL, DNS, HTTPS certificate, LAN firewall and `/api/health` from the same Windows machine.

### Migration fails

Stop deployment, capture the exact migration error, inspect the current migration history and database schema, and fix the migration safely. Never delete the production database as a first response.

## 25. Release checklist

- [ ] Backend Release build passes
- [ ] Backend tests pass
- [ ] Frontend production build passes
- [ ] EF Core migrations reviewed
- [ ] PostgreSQL backup/restore verified
- [ ] Authentication verified
- [ ] Administrator authorization verified
- [ ] Limited-role authorization verified
- [ ] End-to-end admission/registration/finance/assessment flow verified on a test database
- [ ] All enabled screens smoke-tested
- [ ] Windows x64 installer built
- [ ] Windows x86 installer built where required
- [ ] Installer `.exe` visibly carries the SMIS icon
- [ ] Installed application and shortcuts carry the SMIS icon
- [ ] GitHub Release contains verified installer assets
- [ ] Installer copied to deployment flash disk
- [ ] Production secrets configured outside Git
- [ ] Production sign-off recorded
