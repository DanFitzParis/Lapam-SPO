import { test, expect } from '@playwright/test';

test.describe('Dashboard smoke test', () => {
  test('should load dashboard page without error', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Assert page loaded successfully (check for heading)
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
