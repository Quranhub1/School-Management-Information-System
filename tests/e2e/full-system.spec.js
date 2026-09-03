const { test, expect } = require('playwright/test');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:4173';

async function signIn(page) {
  const inputs = page.locator('input');
  await inputs.nth(0).fill('admin');
  await inputs.nth(1).fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('SMIS full-system smoke tests', () => {
  test('API health endpoint is available', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toMatch(/healthy/i);
  });

  test('API authentication works with the CI-seeded administrator', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    });

    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.accessToken).toBeTruthy();
    expect(payload.username).toBe('admin');
    expect(payload.roles).toEqual(expect.arrayContaining(['System Administrator']));
  });

  test('frontend loads and administrator can sign in', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await expect(page.getByText('Sign in to the Institution Management System')).toBeVisible();

    await signIn(page);

    await expect(page.getByRole('heading', { name: 'Institutional Services' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Administration', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Student Management', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finance', exact: true })).toBeVisible();
  });

  test('authenticated frontend request reaches the API', async ({ page }) => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await signIn(page);

    await expect(page.getByRole('heading', { name: 'Institutional Services' })).toBeVisible({ timeout: 15000 });

    const apiResponse = await page.evaluate(async (baseUrl) => {
      const token = sessionStorage.getItem('smis.accessToken');
      const response = await fetch(`${baseUrl}/api/administration/institution-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { status: response.status, contentType: response.headers.get('content-type') };
    }, API_BASE_URL);

    expect(apiResponse.status).toBe(200);
    expect(apiResponse.contentType).toMatch(/json/i);
  });
});
