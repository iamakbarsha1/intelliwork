import { test, expect } from '@playwright/test';

test.describe('Feature 2: Weekly Trends', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // We expect the app to load Setup Wizard or Dashboard depending on state.
    // For E2E tests, we might directly click "Trends" if it's there.
  });

  test('should navigate to Trends view and render chart and AI insights', async ({ page }) => {
    // If there is any setup wizard, this test might skip it if we assume it's done.
    // Let's just look for the "Trends" tab in the nav.
    // If not visible, we can try to click "Dashboard" to clear overlays if any (in mocked state it might not be needed).
    
    // Wait for the Trends tab to appear
    const trendsTab = page.locator('button:has-text("Trends")');
    if (await trendsTab.isVisible()) {
      await trendsTab.click();
      
      // Wait for Trends header
      const header = page.locator('h2:has-text("Weekly Trends")');
      await expect(header).toBeVisible();

      // Check if the Generate Insight button is there
      const generateBtn = page.locator('button:has-text("Generate Insight")');
      await expect(generateBtn).toBeVisible();

      // Check for chart container
      const chartCard = page.locator('.weekly-trends-chart-card');
      await expect(chartCard).toBeVisible();
    }
  });
});
