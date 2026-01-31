import { test, expect } from '@playwright/test';

test.describe('Dashboard Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or navigate to login
    await page.goto('/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Wait for the dashboard to load
    await expect(page.locator('h1:text("Dashboard")')).toBeVisible();
    
    // Check that key metrics are displayed
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Daily Profit')).toBeVisible();
    await expect(page.locator('text=Cumulative Profit')).toBeVisible();
    
    // Verify that charts are rendered
    await expect(page.locator('[aria-label="Allocation chart"]')).toBeVisible();
    
    // Verify that top performing assets table is present
    await expect(page.locator('text=Top Performers')).toBeVisible();
  });

  test('should allow currency switching', async ({ page }) => {
    // Find the currency selector and change currency
    const currencySelector = page.locator('#currency-select');
    await expect(currencySelector).toBeVisible();
    
    // Change to EUR
    await currencySelector.selectOption('EUR');
    
    // Verify the change took effect (would need to check for updated values in a real app)
    await expect(currencySelector).toHaveValue('EUR');
  });

  test('should navigate to portfolio page', async ({ page }) => {
    // Click on the portfolio link in the navigation
    await page.click('text=Portfolio');
    
    // Verify navigation to portfolio page
    await expect(page).toHaveURL(/\/portfolio/);
    await expect(page.locator('h1:text("Portfolio")')).toBeVisible();
  });

  test('should handle language switching', async ({ page }) => {
    // Find the language selector and change language
    const languageSelector = page.locator('#language-switcher');
    await expect(languageSelector).toBeVisible();
    
    // Change to Chinese
    await languageSelector.selectOption('zh');
    
    // Wait for the UI to update
    await page.waitForTimeout(500);
    
    // Verify that some text has changed to Chinese (would need actual Chinese translations)
    // This is a simplified check - in a real test we'd verify actual translation changes
    await expect(languageSelector).toHaveValue('zh');
  });
});
