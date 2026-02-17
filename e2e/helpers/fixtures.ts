import { test as base, type Page } from '@playwright/test'

const DASHBOARD_URL = 'http://localhost:4173/__asset_manager__/'

export const test = base.extend<{
  dashboardPage: Page
}>({
  dashboardPage: async ({ page }, use) => {
    await page.goto(DASHBOARD_URL)
    await page.waitForSelector('[role="gridcell"]', { timeout: 15_000 })
    await use(page)
  },
})

export { expect } from '@playwright/test'
