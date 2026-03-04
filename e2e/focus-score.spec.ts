import { test, expect } from '@playwright/test';

// Mocks the Tauri API
test.beforeEach(async ({ page }) => {
  await page.route('**/__tauri_ipc__', async (route) => {
    const request = route.request();
    const payload = request.postDataJSON() || {};
    
    if (payload.cmd === 'get_tracking_state') {
        await route.fulfill({ json: { is_tracking: true, current_app: 'VS Code', current_window: 'src/lib/focus-score.ts', current_category: 'Development', is_idle: false, session_duration_seconds: 3600, today_total_seconds: 7200 } });
    } else if (payload.cmd === 'get_activities') {
        await route.fulfill({
            json: [
                {
                    id: '1',
                    app_name: 'VS Code',
                    window_title: 'src/lib/focus-score.ts',
                    start_time: new Date(Date.now() - 3600 * 1000).toISOString(),
                    end_time: new Date().toISOString(),
                    duration_seconds: 3600,
                    category: 'Development',
                    confidence: 0.95,
                    is_meeting: false,
                    is_idle: false,
                    created_at: new Date().toISOString()
                }
            ]
        });
    } else if (payload.cmd === 'get_all_config') {
        await route.fulfill({ json: { onboarding_completed: 'true' } });
    } else {
        // Mock fallback
        await route.fulfill({ json: {} });
    }
  });
  
  await page.addInitScript(() => {
    // Basic Tauri globals mock to allow frontend to boot
    window.__TAURI__ = {
      ipc: {
        invoke: async () => null
      }
    };
  });
});

test('Displays Focus Score widget correctly in compact and full mode', async ({ page }) => {
  await page.goto('http://localhost:1420');

  // App boots directly to Dashboard because onboarding is mocked as completed
  await expect(page.getByTestId('app-root')).toBeVisible();

  // Test Dashboard full Focus Score widget
  const focusScoreCard = page.getByTestId('focus-score');
  await expect(focusScoreCard).toBeVisible();
  
  // It should have high focus score since there's 1hr of deep work and no switches in the mock 
  await expect(page.locator('.focus-score__ring-value')).toHaveText(/100/);

  // Navigate to Live View to test compact mode
  await page.getByRole('button', { name: /Live Activity/i }).click();

  // Compact form should be present
  const compactFocusScore = page.getByTestId('focus-score-compact');
  await expect(compactFocusScore).toBeVisible();

  // It should also show the same score
  await expect(page.locator('.focus-score--compact__value')).toHaveText(/100/);
});
