import { test, expect } from '@playwright/test';

test('App displays correct title', async ({ page }) => {
  // We navigate to the development server where Vite is hosting the frontend
  await page.goto('http://localhost:1420/');

  // We wait for the main React root to mount
  await page.waitForSelector('#root');
  
  // Basic sanity check to ensure the React app booted
  const title = await page.title();
  expect(title).toBe('IntelliWork');
});
