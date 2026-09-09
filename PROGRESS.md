# School Management Information System — Project Progress

**Last updated:** 2026-09-09  
**Tracking branch:** `main`  
**Current release:** `v0.2.0`  
**Currency:** UGX

## Current status

The core backend, persistence, security hardening, frontend, automated verification, and native desktop release pipeline are implemented. **SMIS v0.2.0 is published on GitHub with four verified desktop assets:** Windows x64, Windows x86, Ubuntu x64 `.deb`, and Ubuntu x64 `.AppImage`.

Corrected native release workflow run `34351052149` completed successfully for Windows x86/x64, Ubuntu x64, and release publication. The obsolete tag-helper workflow has been removed. The later duplicate desktop-workflow cleanup on `main` also passed the full CI suite, including native desktop builds.

## Completed / verified

- [x] .NET 8 backend solution and modular domain structure
- [x] EF Core persistence and PostgreSQL integration
- [x] Academic, admissions, assessment, attendance, clinical, examinations, finance, identity, staff and student domains
- [x] Hostel and transport vertical slices
- [x] Teaching-to-attendance workflow
- [x] Admission decision synchronization and duplicate-admission prevention
- [x] Student/enrollment reuse during admission
- [x] Finance repository compatibility and explicit DI registrations
- [x] Production database/JWT placeholder validation
- [x] Production admin seed password enforcement
- [x] JWT issuer/audience validation
- [x] FinanceRead authorization policy
- [x] Login rate limiting
- [x] Admission upload validation
- [x] Assessment record lookup fix
- [x] Attendance and examination authorization regression coverage
- [x] UGX currency requirement
- [x] Backend build and automated tests
- [x] PostgreSQL migration/model consistency validation in CI
- [x] Permanent PostgreSQL integration tests
- [x] API startup/readiness verification
- [x] Frontend production build
- [x] Playwright/browser installation and E2E smoke tests
- [x] Approved `frontend/public/icon.png` validation and Tauri icon generation
- [x] Installer privacy/license asset validation
- [x] Windows x86/x64 NSIS installers
- [x] Ubuntu x64 `.deb` and `.AppImage` packages
- [x] GitHub `v0.2.0` release publication and asset verification
- [x] Obsolete release tag-helper workflow removed
- [x] Duplicate WPF desktop workflow removed; `desktop-ci.yml` remains the effective WPF CI workflow
- [x] Full CI verification after workflow cleanup
- [x] No open GitHub issues at release verification

## Remaining production acceptance gates

These require an actual target deployment or physical client/test environment and must not be marked complete from repository inspection alone:

- [ ] Execute the isolated golden-path acceptance test on a dedicated test database
- [ ] Verify administrator and restricted-role authorization end-to-end
- [ ] Smoke-test every enabled frontend module and major workflow
- [ ] Verify admissions → acceptance → admission → student → enrollment → course registration
- [ ] Verify finance posting, adjustments, balances, ledger/reporting and UGX presentation
- [ ] Verify attendance manual/QR generation, validation, closing and production secret
- [ ] Verify assessment/examination/result calculations and transcript/progression behavior
- [ ] Verify clinical/workplace-learning persistence and workflows
- [ ] Verify staff and student management workflows
- [ ] Verify production deployment configuration, `/api/health`, systemd service and logs
- [ ] Verify Nginx/HTTPS/LAN configuration where used
- [ ] Verify PostgreSQL backup and restore on a separate test database/server
- [ ] Verify clean-machine Windows installation and first-run server connection
- [ ] Visually verify Windows installer, installed application and shortcuts use the approved SMIS icon
- [ ] Complete final security/configuration review and production sign-off
- [ ] Configure `main` branch protection / required status checks (requires repository administration access)

## Release

**Released:** `v0.2.0`  
**Corrected release workflow:** `34351052149`  
**Release target:** `9163ef416f8d44be66ab5e97408b1d2fcd3ed27f`  
**Current main:** `13057015f3d885eacf406202b04f9f4230be9c81`

Expected published assets:

1. `School.Management.Information.System_0.2.0_amd64.AppImage`
2. `School.Management.Information.System_0.2.0_amd64.deb`
3. `School.Management.Information.System_0.2.0_x64-setup.exe`
4. `School.Management.Information.System_0.2.0_x86-setup.exe`

## Production rules

- Production secrets must never be committed to Git.
- `SEED_ADMIN_PASSWORD` and the attendance QR secret must be supplied by the deployment environment.
- Production must use strong unique administrator credentials.
- PostgreSQL must not be exposed directly to ordinary client machines.
- Production migrations must be reviewed and backed up before application.
- Finance amounts are institutional **UGX** unless the system is explicitly extended for multi-currency support.
- CI success does not substitute for target-environment acceptance.

## Definition of done

SMIS is ready for production sign-off only when the remaining target-environment acceptance gates above are completed, CI remains green, deployment health is verified, critical workflows are exercised successfully, backups/restores are validated, and repository administration has configured branch protection where permitted.
