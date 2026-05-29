import { expect, test } from '@playwright/test';

test('shows the cooking inspiration app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Cooking Inspiration' })).toBeVisible();
  await expect(page.getByText('Fresh ideas for meals, planning, and shopping are coming soon.')).toBeVisible();
});
