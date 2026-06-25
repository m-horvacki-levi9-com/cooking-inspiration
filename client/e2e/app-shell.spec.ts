import { expect, test } from '@playwright/test';

test('shows recipe results as a list and opens an accessible detail modal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://platform.getbring.com/widgets/import.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: '',
    });
  });
  await page.route('**/api/recipes/search?keyword=pasta', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        recipes: [
          {
            title: 'Creamy Pesto Pasta',
            cookpadUrl: 'https://cookpad.com/recipe-1',
            imageUrl: 'https://images.example.com/pasta.jpg',
            description:
              'A quick pasta dinner with pesto and cream that is easy to read in the modal after opening recipe details.',
            ingredients: ['Pasta', 'Pesto', 'Cream'],
          },
          {
            title: 'Roasted Tomato Soup',
            cookpadUrl: 'https://cookpad.com/recipe-2',
            imageUrl: null,
            description: null,
            ingredients: [],
          },
        ],
      }),
    });
  });

  await page.goto('/');

  await expect(
    page.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeDisabled();

  await page.getByRole('textbox', { name: 'What would you like to eat for the weekend?' }).fill('pasta');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByRole('heading', { level: 2, name: 'Recipe ideas' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'View details' })).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Import to Bring!' })).toHaveCount(2);
  await expect(page.getByText('Description coming soon.')).toBeVisible();

  await page.getByRole('button', { name: 'View details' }).first().click();

  const dialog = page.getByRole('dialog');

  await expect(dialog).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Creamy Pesto Pasta' })).toBeVisible();
  await expect(dialog.getByText('Pasta', { exact: true })).toBeVisible();
  await expect(dialog.getByText('We will soon add method steps here')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'View details' }).first()).toBeFocused();
});
