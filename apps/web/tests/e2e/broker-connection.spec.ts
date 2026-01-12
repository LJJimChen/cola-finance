import { test, expect } from '@playwright/test'

test.describe('T043: full user journey (signup → connect broker → view portfolio)', () => {
  test('user can sign up, connect a broker, refresh portfolio, and see holdings', async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`
    const password = 'Password!1'

    // Sign up
    await page.goto('/auth/signup')
    await page.getByTestId('signup-email').fill(email)
    await page.getByTestId('signup-password').fill(password)
    await page.getByTestId('signup-locale').selectOption('en')
    await page.getByTestId('signup-submit').click()

    // Expect to land on dashboard/home
    await expect(page.getByTestId('dashboard')).toBeVisible()

    // Navigate to brokers and connect Futu
    await page.goto('/brokers')
    await expect(page.getByTestId('brokers-list')).toBeVisible()
    await page.getByTestId('broker-card-futu').getByRole('button', { name: /connect/i }).click()

    // Expect an authorization task to be created and status surfaced to the user
    await expect(page.getByTestId('auth-task-status')).toContainText(/
      pending|in progress|paused|completed|failed
    /i)

    // Navigate to portfolio and trigger a refresh
    await page.goto('/portfolio')
    await expect(page.getByTestId('portfolio-page')).toBeVisible()
    await page.getByTestId('portfolio-refresh').click()

    // Polling should eventually show summary + holdings
    await expect(page.getByTestId('portfolio-summary')).toBeVisible()
    await expect(page.getByTestId('holdings-list')).toBeVisible()

    // Holdings list should display at least one row once data is collected
    await expect(page.getByTestId('holdings-list')).toContainText(/\S/)
  })
})
