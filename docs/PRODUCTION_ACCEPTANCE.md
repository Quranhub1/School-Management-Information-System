# SMIS Production Acceptance Runbook

**Release:** `v0.2.0`  
**System currency:** UGX  
**Rule:** CI/build success is supporting evidence only. Every target-environment gate requires an observed result and evidence.

## 1. Test environment

Record before testing:

- Release/tag:
- Server commit SHA:
- API base URL:
- Frontend URL:
- PostgreSQL host/database:
- Test database name:
- Windows client version/architecture:
- Ubuntu client version/architecture:
- Tester/date:

Never use production data for acceptance testing. Use a dedicated test database and non-production credentials/secrets.

## 2. Preflight

- [ ] Confirm the intended release SHA/tag is deployed.
- [ ] Confirm PostgreSQL is reachable from the API host only.
- [ ] Confirm migrations apply cleanly to a fresh test database.
- [ ] Confirm `/api/health` returns healthy from the deployment host.
- [ ] Confirm the API systemd service is active and logs contain no startup exceptions.
- [ ] Confirm production JWT/database/attendance secrets are supplied by the environment, not committed files.
- [ ] Confirm institutional currency is UGX.

## 3. Authentication and authorization

### Administrator

- [ ] Sign in as a dedicated test System Administrator.
- [ ] Confirm administrator navigation exposes only enabled modules.
- [ ] Create/read/update/delete a representative record where the role is authorized.
- [ ] Confirm audit/security-relevant actions produce expected audit information.

### Restricted role

- [ ] Sign in as a dedicated restricted test role.
- [ ] Confirm permitted screens/actions work.
- [ ] Attempt an administrator-only API action directly; expect `401`/`403` as appropriate.
- [ ] Confirm hidden UI navigation is not treated as the security boundary.

## 4. Golden academic/admissions path

Use one synthetic applicant/student and record each identifier.

- [ ] Create applicant.
- [ ] Verify applicant data persists after refresh/re-login.
- [ ] Make an admissions decision.
- [ ] Verify accepted status synchronizes correctly.
- [ ] Admit the accepted applicant.
- [ ] Verify no duplicate admission is created.
- [ ] Verify/reuse the student record correctly.
- [ ] Enroll the student in the intended academic structure.
- [ ] Register the student for a course.
- [ ] Confirm all records remain linked after reload.

## 5. Finance

All monetary values in this test must be recorded as **UGX**.

- [ ] Create a representative finance posting.
- [ ] Verify debit/credit or configured posting semantics.
- [ ] Verify adjustment workflow and authorization.
- [ ] Verify student/account balance.
- [ ] Verify ledger/report output agrees with the posting.
- [ ] Verify invalid/unauthorized postings are rejected.
- [ ] Verify duplicate submission does not create an unintended duplicate transaction.

## 6. Attendance

- [ ] Create/open the intended attendance context.
- [ ] Exercise manual attendance entry.
- [ ] Generate attendance QR using a deployment-provided secret.
- [ ] Validate an allowed QR scan/request.
- [ ] Reject an invalid/expired/tampered QR request.
- [ ] Close attendance and verify the closed session cannot be altered by unauthorized users.
- [ ] Verify attendance persists after refresh/re-login.

## 7. Assessment and examinations

- [ ] Create/configure a representative assessment/examination.
- [ ] Enter marks for a test student.
- [ ] Verify grading calculation.
- [ ] Verify result publication/state transitions.
- [ ] Verify GPA/CGPA calculation where applicable.
- [ ] Verify academic-standing/progression behavior.
- [ ] Verify transcript output reflects the stored result data.
- [ ] Verify unauthorized result changes are rejected.

## 8. Clinical/workplace learning

- [ ] Create a representative placement/clinical/workplace-learning record.
- [ ] Verify required student/course/placement relationships.
- [ ] Record a representative activity/outcome.
- [ ] Verify persistence and role restrictions.

## 9. Staff and student management

- [ ] Create/update a synthetic staff record.
- [ ] Create/update a synthetic student record where permitted.
- [ ] Verify search/detail views return the persisted records.
- [ ] Verify restricted users cannot modify protected records.

## 10. Frontend smoke test

For every enabled module visible to the test administrator:

- [ ] Open the module.
- [ ] Verify the initial API request succeeds.
- [ ] Verify list/table rendering.
- [ ] Verify create/edit/detail workflow where applicable.
- [ ] Verify validation/error states.
- [ ] Refresh and confirm persistence.
- [ ] Verify logout and re-login do not corrupt client state.

Record any module that is intentionally read-only or not enabled rather than marking it failed.

## 11. LAN/Nginx/HTTPS

When the production deployment uses Nginx:

- [ ] Resolve the configured LAN hostname from a client machine.
- [ ] Verify HTTPS certificate and hostname.
- [ ] Verify frontend-to-API requests use the intended HTTPS/LAN origin.
- [ ] Verify ordinary client machines cannot connect directly to PostgreSQL.
- [ ] Verify reverse-proxy/API errors are observable in server logs without exposing secrets.

## 12. Backup and restore

- [ ] Create a PostgreSQL backup of the dedicated acceptance database.
- [ ] Restore it into a separate database/server.
- [ ] Confirm migration/schema compatibility.
- [ ] Confirm representative student, admission, finance and assessment records exist after restore.
- [ ] Confirm the restored database can serve the API without data-integrity errors.

Do not test restore by overwriting the original production database.

## 13. Desktop clients

### Windows

- [ ] Install `x64` installer on a clean Windows x64 machine.
- [ ] If x86 is required, install the x86 installer on a supported x86 test machine.
- [ ] Launch the application.
- [ ] Verify first-run server/API connection configuration.
- [ ] Sign in and complete a basic authenticated workflow.
- [ ] Verify installed application and shortcuts visibly use the approved SMIS icon.
- [ ] Uninstall cleanly.

### Ubuntu

- [ ] Install the `.deb` package on a clean Ubuntu x64 machine.
- [ ] Launch and verify server/API connectivity.
- [ ] Optionally validate the `.AppImage` on a supported Ubuntu x64 environment.
- [ ] Sign in and complete a basic authenticated workflow.

## 14. Security/configuration sign-off

- [ ] No production secrets are present in Git-tracked files.
- [ ] Administrator password is unique and strong.
- [ ] JWT issuer/audience/key configuration matches the deployment.
- [ ] Attendance QR secret is unique and deployment-provided.
- [ ] Database credentials are deployment-provided and least-privileged for the operating model.
- [ ] Error responses do not disclose secrets, connection strings or sensitive stack traces.
- [ ] Backup access is restricted.
- [ ] Data retention/access responsibilities are assigned to the institution.

## 15. Evidence and sign-off

For each completed gate, record a short evidence reference: CI run, deployment log, screenshot, API response, database verification, or test record. Do not mark a gate complete solely because the corresponding source code exists.

**Acceptance result:** PASS / FAIL / BLOCKED  
**Blocking defects:**  
**Evidence location:**  
**Tester:**  
**Date:**  
**Production owner:**  

## Completion rule

SMIS is not production-signed-off until all applicable sections pass, CI remains green, the deployment health check passes, backup/restore has been demonstrated, and repository administration has enabled the required branch protection/ruleset policy.
