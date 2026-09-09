import { test, expect } from 'playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:4173';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

async function signIn(page) {
  const inputs = page.locator('input');
  await inputs.nth(0).fill('admin');
  await inputs.nth(1).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function getAdminToken(request) {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { username: 'admin', password: ADMIN_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.accessToken).toBeTruthy();
  return payload.accessToken;
}

test.describe('SMIS full-system smoke tests', () => {
  test('API health endpoint is available', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toMatch(/healthy/i);
  });

  test('API authentication works with the CI-seeded administrator', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: { username: 'admin', password: ADMIN_PASSWORD },
    });

    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.accessToken).toBeTruthy();
    expect(payload.username).toBe('admin');
    expect(payload.roles).toEqual(expect.arrayContaining(['SystemAdministrator']));
  });

  test('admissions management API rejects unauthenticated access', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/admissions`);
    expect([401, 403]).toContain(response.status());
  });

  test('authenticated administrator can read admissions and invalid admission operations fail safely', async ({ request }) => {
    const token = await getAdminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const unknownId = '00000000-0000-0000-0000-000000000011';
    const zeroId = '00000000-0000-0000-0000-000000000000';

    const list = await request.get(`${API_BASE_URL}/api/admissions`, { headers });
    expect(list.ok()).toBeTruthy();
    expect(await list.json()).toEqual(expect.any(Array));

    const missing = await request.get(`${API_BASE_URL}/api/admissions/${unknownId}`, { headers });
    expect(missing.status()).toBe(404);

    const admit = await request.post(`${API_BASE_URL}/api/admissions/${unknownId}/admit`, {
      headers,
      data: {
        programmeId: zeroId,
        intakeId: zeroId,
        academicYearId: zeroId,
        studentNumber: 'CI-NONEXISTENT',
        admissionNumber: null,
        admissionType: null,
        reportingDate: null,
        decisionReference: 'CI-boundary-test',
      },
    });
    expect(admit.status()).toBe(404);
  });

  test('authenticated attendance API protects manual and QR recording paths', async ({ request }) => {
    const token = await getAdminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const unknownSessionId = '00000000-0000-0000-0000-000000000001';
    const unknownStudentId = '00000000-0000-0000-0000-000000000002';

    const manual = await request.post(`${API_BASE_URL}/api/attendance/sessions/${unknownSessionId}/records`, {
      headers,
      data: { studentId: unknownStudentId, status: 'Present', remarks: 'CI boundary test' },
    });
    expect(manual.status()).toBe(404);

    const qr = await request.post(`${API_BASE_URL}/api/attendance/sessions/${unknownSessionId}/qr-records`, {
      headers,
      data: { studentId: unknownStudentId, status: 'Present', remarks: 'CI boundary test', token: 'invalid-token' },
    });
    expect(qr.status()).toBe(401);

    const unauthenticated = await request.post(`${API_BASE_URL}/api/attendance/sessions/${unknownSessionId}/records`, {
      data: { studentId: unknownStudentId, status: 'Present' },
    });
    expect([401, 403]).toContain(unauthenticated.status());
  });

  test('attendance QR endpoint returns a rotating token for an authenticated user', async ({ request }) => {
    const token = await getAdminToken(request);
    const sessionId = '00000000-0000-0000-0000-000000000003';
    const response = await request.get(`${API_BASE_URL}/api/attendance/sessions/${sessionId}/qr`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.attendanceSessionId).toBe(sessionId);
    expect(payload.token).toMatch(/^[a-f0-9]{64}$/);
    expect(payload.rotationSeconds).toBe(60);
    expect(payload.expiresAtUtc).toBeTruthy();
  });

  test('frontend loads and administrator can sign in', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Sign in to/ })).toBeVisible();

    await signIn(page);

    await expect(page.getByRole('complementary').getByRole('heading', { name: 'Institutional Services' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Administration', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Student Management', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finance', exact: true })).toBeVisible();
  });

  test('administrator can open the attendance workspace', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await signIn(page);

    const attendanceNav = page.getByRole('button', { name: 'Attendance', exact: true });
    await expect(attendanceNav).toBeVisible({ timeout: 15000 });
    await attendanceNav.click();

    await expect(page.getByRole('region', { name: 'Attendance management' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Daily' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Student history' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'QR attendance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open session' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Record attendance' })).toBeVisible();
  });

  test('authenticated frontend request reaches the database-backed API', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await signIn(page);

    await expect(page.getByRole('complementary').getByRole('heading', { name: 'Institutional Services' })).toBeVisible({ timeout: 15000 });

    const apiResponse = await page.evaluate(async (baseUrl) => {
      const token = sessionStorage.getItem('smis.accessToken');
      const response = await fetch(`${baseUrl}/api/administration/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: response.status, contentType: response.headers.get('content-type') };
    }, API_BASE_URL);

    expect(apiResponse.status).toBe(200);
    expect(apiResponse.contentType).toMatch(/json/i);
  });
});
