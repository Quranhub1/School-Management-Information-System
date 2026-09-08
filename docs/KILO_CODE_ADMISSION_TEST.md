# Kilo Code: SMIS Admission Golden-Path Test

## Objective
Use Kilo Code to run a real end-to-end acceptance test of the School Management Information System using a fresh test database. The test must verify authentication, admission, student creation, assessment, fee charging, installment payments, and downstream student workflows without corrupting production data.

## Mandatory test identity
- Student name: **Kaigwa Akram**
- Assessment/admission number supplied for the test: **U075/042**
- Reporting/admission date: **2026-09-09**
- Currency: **UGX (Ugandan Shilling)**
- Administrator login: **admin / admin123** for a test environment only

## Safety rules
1. Do NOT run this against the school's production database.
2. Create/use an isolated PostgreSQL database such as `school_management_kilo_e2e`.
3. Apply all current EF Core migrations before testing.
4. Never hard-code or expose production passwords, JWT keys, or real student data.
5. If the existing test database already contains U075/042, either reset the isolated database or use a clearly marked disposable test database.
6. Record every failed step with the HTTP status, endpoint/UI screen, response/error text, and likely root cause.

## Phase 1 — Start and verify the stack
From the repository root:

```bash
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln --configuration Release
dotnet tool restore
dotnet ef database update --project src/SchoolManagement.Infrastructure/SchoolManagement.Infrastructure.csproj --startup-project src/SchoolManagement.Api/SchoolManagement.Api.csproj --configuration Release
```

Start the API using the isolated database and verify:

```bash
curl --fail http://127.0.0.1:5080/health
```

Then start the frontend and verify it loads at the configured frontend URL.

## Phase 2 — Administrator access
1. Open the login screen.
2. Sign in as `admin` with password `admin123` in the isolated test environment.
3. Confirm the administrator reaches the dashboard.
4. Confirm the administrator can see the administration, students, admissions, academics, assessment, attendance, examinations, finance, and other enabled institutional modules.
5. Create one disposable non-administrator test user.
6. Sign out and verify the new user's restricted permissions.
7. Sign back in as administrator and remove/disable the disposable user after the check.

## Phase 3 — Prepare academic setup
Before admission, verify that the test database contains at least:
- one active academic year;
- one active intake;
- one valid programme;
- any class/year/stream setup required by the selected programme;
- fee structures appropriate for the programme.

If these are missing, create them through the normal administrator UI/API and record their IDs/names in the test log.

## Phase 4 — Admission of Kaigwa Akram
Run the admission workflow exactly as a real admissions officer would:

1. Create/find applicant **Kaigwa Akram**.
2. Use **U075/042** as the supplied assessment/admission number wherever the application calls for that identifier.
3. Set the admission/reporting date to **2026-09-09**.
4. Complete all mandatory applicant and admission fields.
5. Save the application.
6. Verify the saved applicant can be retrieved.
7. Progress the application through the configured decision/acceptance workflow.
8. Admit the accepted applicant into the selected programme, intake, and academic year.
9. Verify that the system creates the student record and active enrollment.
10. Verify the student number/assessment number remains **U075/042** where that field is the system's student identifier; if the application has separate generated student-number and assessment-number fields, preserve **U075/042** specifically as the assessment/admission number and record the generated student number separately.
11. Verify the student appears in student management, admission records, and the selected academic structure.

## Phase 5 — Assessment workflow
For the newly admitted student:
1. Open Assessment.
2. Locate Kaigwa Akram/U075/042.
3. Create the applicable assessment record(s) using valid subjects/courses.
4. Enter marks within the configured valid range.
5. Save and retrieve the marks.
6. Verify totals/grades/results are calculated correctly.
7. Verify an unauthorized/restricted user cannot modify assessment records unless their role permits it.

## Phase 6 — Fees and installment payments
Use **UGX only**.

1. Open Finance/Student Fees for Kaigwa Akram.
2. Apply a valid fee charge for the selected academic period/programme.
3. Verify the charge appears as an outstanding balance.
4. Pay the balance in at least **two installments** rather than one payment.
5. After each installment verify:
   - payment is recorded once;
   - receipt/reference is generated;
   - outstanding balance decreases by exactly the installment amount;
   - total paid equals the sum of installments;
   - no negative or duplicated balance is produced;
   - currency is displayed as UGX.
6. Make the final installment and verify the outstanding balance reaches zero when the installments exactly cover the charge.
7. Verify the student's finance history and applicable reports reflect the payments.
8. Verify cancellation/reversal rules prevent an unauthorized or duplicate reversal.

Use test amounts appropriate to the configured fee structure; do not invent a USD/EUR conversion. The system currency is UGX.

## Phase 7 — Downstream student journey
Verify the admitted student can be found/used by the enabled modules that apply to the programme:
- Student profile/management
- Academic enrollment
- Assessment
- Attendance
- Examinations/results
- Finance/fees/receipts
- Certificates where eligible
- Library where enabled
- Hostel where enabled
- Transport where enabled
- Communication/notifications where enabled

For each applicable module, perform at least one read operation and one safe create/update operation, then reload the record and verify persistence.

## Phase 8 — Negative and permission tests
Verify at least:
- unauthenticated access returns 401/403 where protected;
- restricted users cannot perform administrator-only operations;
- duplicate U075/042 admission/student creation is rejected safely;
- duplicate fee payment is not silently accepted;
- invalid assessment marks are rejected;
- invalid academic/programme references are rejected;
- deleting an admitted student or financial record is protected by the application's business rules.

## Phase 9 — Automated test suite
From `backend/` run:

```bash
dotnet test SchoolManagement.sln --configuration Release --no-restore --logger "trx;LogFileName=kilo-test-results.trx"
```

From `frontend/` run:

```bash
npm ci
npm run build
npx playwright install --with-deps chromium
npx playwright test --config=playwright.config.cjs --reporter=line
```

All failures must be fixed rather than skipped or marked as expected unless the test is explicitly documented as a known non-applicable module.

## Pass criteria
The Kilo Code run is successful only when:
- the backend builds cleanly;
- all backend test projects pass;
- frontend builds cleanly;
- Playwright E2E tests pass;
- admin login works;
- Kaigwa Akram/U075/042 is admitted on 2026-09-09 in the isolated database;
- assessment data persists and calculates correctly;
- fees are recorded in UGX;
- at least two installment payments persist and reconcile exactly;
- applicable downstream modules can read the student's record;
- authorization and duplicate-data protections behave correctly;
- no test is disabled merely to obtain a green result.

## Final Kilo Code report
Return a concise table with:

| Area | Result | Evidence |
|---|---|---|
| Backend build | PASS/FAIL | command + final output |
| Backend tests | PASS/FAIL | passed/failed count |
| Frontend build | PASS/FAIL | command + final output |
| Playwright | PASS/FAIL | passed/failed count |
| Admin login | PASS/FAIL | observed result |
| Admission U075/042 | PASS/FAIL | student/admission IDs |
| Assessment | PASS/FAIL | records/results |
| Fees | PASS/FAIL | UGX charge |
| Installments | PASS/FAIL | installment amounts + final balance |
| Downstream modules | PASS/FAIL | module-by-module evidence |
| Permissions | PASS/FAIL | unauthorized operations checked |

Do not report PASS unless the step was actually executed and verified.