import { expect, test } from '@playwright/test';

test('shows the cooking inspiration app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Cooking Inspiration' })).toBeVisible();
  await expect(page.getByText('Search Cookpad recipes by keyword and discover your next meal idea.')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Find a recipe to cook tonight' })).toBeVisible();
});
