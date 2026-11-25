import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PAGES_TO_TEST = [
  { path: '/', name: 'Login page' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/students', name: 'Students list' },
  { path: '/staff', name: 'Staff list' },
  { path: '/attendance', name: 'Attendance' },
  { path: '/finance', name: 'Finance' },
  { path: '/library', name: 'Library' },
  { path: '/timetable', name: 'Timetable' },
  { path: '/reports', name: 'Reports' },
  { path: '/settings', name: 'Settings' },
]

for (const page of PAGES_TO_TEST) {
  test.describe(`Accessibility: ${page.name}`, () => {
    test(`should have no accessibility violations on ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path)
      
      // Wait for page to be ready
      await browserPage.waitForLoadState('networkidle')
      
      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })
  })
}

// Test common interactive components
test.describe('Component accessibility', () => {
  test('buttons should be accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const results = await new AxeBuilder({ page })
      .include('button, [role="button"]')
      .analyze()
    
    expect(results.violations).toEqual([])
  })

  test('forms should be accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const results = await new AxeBuilder({ page })
      .include('form, input, select, textarea, label')
      .analyze()
    
    expect(results.violations).toEqual([])
  })

  test('tables should be accessible', async ({ page }) => {
    await page.goto('/students')
    await page.waitForLoadState('networkidle')
    
    const results = await new AxeBuilder({ page })
      .include('table, [role="grid"]')
      .analyze()
    
    expect(results.violations).toEqual([])
  })

  test('modals/dialogs should be accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Trigger a modal if possible
    const modalTrigger = page.locator('[data-testid="open-modal"], button:has-text("Add"), button:has-text("Create")').first()
    if (await modalTrigger.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalTrigger.click()
      await page.waitForSelector('[role="dialog"], [data-testid="modal"]', { timeout: 2000 }).catch(() => {})
    }
    
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"], [data-testid="modal"]')
      .analyze()
    
    expect(results.violations).toEqual([])
  })

  test('navigation should be accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const results = await new AxeBuilder({ page })
      .include('nav, [role="navigation"], aside[aria-label*="sidebar" i]')
      .analyze()
    
    expect(results.violations).toEqual([])
  })
})