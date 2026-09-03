import { test, expect } from '@playwright/test'

const baseUrl = process.env.SMOKE_TEST_FRONTEND_URL ?? 'http://127.0.0.1:4173'
const username = process.env.SMOKE_TEST_USERNAME ?? 'admin'
const password = process.env.SMOKE_TEST_PASSWORD

if (!password) throw new Error('SMOKE_TEST_PASSWORD is required for the full-system browser smoke test.')

test('frontend loads, authenticates against the live API, and opens the authenticated workspace', async ({ page }) => {
  const apiRequests = []
  page.on('request', request => {
    if (request.url().includes('/api/')) apiRequests.push(request)
  })

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { name: /sign in to the institution management system/i })).toBeVisible()

  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Institutional Services' })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()

  const apiRequestUrls = apiRequests.map(request => request.url())
  expect(apiRequestUrls.some(url => url.endsWith('/api/auth/login'))).toBe(true)
})

test('frontend serves its application shell', async ({ request }) => {
  const response = await request.get(`${baseUrl}/`)
  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain('<div id="root"></div>')
})
