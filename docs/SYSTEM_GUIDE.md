# SMIS System Guide

This guide explains how the School Management Information System (SMIS) is organized and how its key operational features behave. Use it alongside [INSTALLATION.md](../INSTALLATION.md) for setup and deployment, [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md) for role-specific dashboards, and [PRODUCTION_ACCEPTANCE.md](PRODUCTION_ACCEPTANCE.md) for verification and sign-off.

## 1. System architecture

SMIS is a LAN-first web application with these main parts:

- **Frontend:** React, TypeScript and Vite, located in `frontend/`. It renders the workspace, role-specific navigation, forms, dashboards and reports.
- **Backend API:** ASP.NET Core 8, located in `backend/src/SchoolManagement.Api/`. It authenticates requests, enforces authorization policies and exposes application endpoints.
- **Database:** PostgreSQL, accessed by the backend through Entity Framework Core. Persistent institutional, student, staff, academic and finance data belongs on the server/database rather than in browser storage.
- **Institution settings:** Server-backed settings provide the institution name, motto, logo, primary colour and accent colour. The active settings endpoint is `GET /api/public/institution-settings/active`; administrative settings use the authenticated administration endpoints.
- **Desktop packaging:** The web application can also be packaged for supported Windows and Ubuntu environments. Desktop clients still need to be configured to reach the intended API/server.

The frontend hiding a navigation item is not a security boundary. The API must independently enforce each role's permissions.

## 2. Start the development environment

Follow the full instructions in [INSTALLATION.md](../INSTALLATION.md) for prerequisites, database configuration, migrations and production deployment.

For local development, open separate terminals.

### Backend

From the repository root:

```powershell
cd backend\src\SchoolManagement.Api
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run
```

Configure the database connection string and JWT settings for your environment before signing in. Do not commit secrets or use development credentials in production.

### Frontend

From the repository root:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite. The frontend's pre-start checks copy the required font files into `frontend/public/assets/fonts/`, so the application does not need an external font service at runtime. If a font-copy check fails, verify that the declared `@fontsource-variable/inter` and `@fontsource-variable/plus-jakarta-sans` packages are installed.

The API base URL is configured with `VITE_API_BASE_URL` when the frontend and API are served from different origins. Keep it consistent with the server actually running.

## 3. Institution branding and colours

System Administrators configure branding in **Administration → Institution Settings → Branding**.

- **Primary colour** is the main institutional colour used by the workspace and primary actions.
- **Accent colour** is the supporting highlight colour used for active states, emphasis and focus details.
- The institutional logo and name are also used in the workspace branding.

After settings are saved, the frontend receives the updated active institution settings and updates its CSS branding variables. The intent is for shared UI elements to use these variables rather than fixed blue values. Special-purpose states such as destructive actions, errors, warnings and success indicators should retain their semantic meaning instead of being recoloured as ordinary primary actions.

If a colour appears unchanged, confirm that the settings were saved, that the active institution is the intended one, and that the browser has loaded the current frontend build. Custom components that use hard-coded colours should be updated to use the shared branding variables.

## 4. Backup and restore

The **System Administration → Backups** screen creates and lists PostgreSQL backups and allows an authorized administrator to restore a selected backup.

- Backups are written to the configured local backup directory on the computer running the SMIS backend. They are not automatically uploaded to a cloud service and are not stored inside the project directory.
- The screen displays the resolved backup directory returned by the backend. Check that location on the backend host when managing backup files.
- Automatic backups, when enabled, run at the configured interval while the backend process is running.
- A successful local backup is not a substitute for an off-device copy. Copy important backups to a separately managed, access-controlled drive or backup target to protect against disk or host failure.
- Restore can replace current database contents and remove newer records. The interface requires an explicit confirmation. Only restore into the intended environment and, before production recovery, preserve a current backup where possible.
- Test restores periodically against a separate test database and verify representative records after restoration. Do not test by overwriting the production database.

Backup folder permissions, retention, monitoring and off-device copies are operational responsibilities of the institution or deployment administrator.

## 5. Authentication, roles and data access

Users sign in through the institutional login screen. Authenticated API requests use the current access token. Roles determine which modules and operations a user may access.

- A hidden screen does not replace API authorization.
- A `401 Unauthorized` response usually means authentication is missing or invalid; `403 Forbidden` means the identity is authenticated but lacks permission for that operation.
- Do not share administrator credentials. Create individual accounts with the minimum required permissions.
- Review audit information for security-sensitive actions and verify persistence by refreshing or signing in again.

See [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md) for the dashboard and role access design.

## 6. Data, troubleshooting and safe operations

- Use a dedicated non-production database for development, demonstrations and acceptance tests.
- Confirm the API is listening on its configured URL and that PostgreSQL is reachable from the backend host.
- If the frontend loads but data requests fail, check `VITE_API_BASE_URL`, browser network errors, API logs, authentication and CORS configuration.
- If data appears missing after a refresh or re-login, verify that the frontend and API are using the same backend instance and PostgreSQL database.
- Do not delete the database or run destructive resets as an initial troubleshooting step.
- Keep dependencies, the operating system, .NET and PostgreSQL maintained. Review dependency audit findings before applying potentially breaking automatic upgrades.

## 7. Production readiness

Before production use, complete the [Production Acceptance Runbook](PRODUCTION_ACCEPTANCE.md), including authentication and role checks, critical workflows, deployment connectivity, backup/restore testing and evidence-based sign-off. A successful build alone does not prove that the deployed system is operationally ready.
