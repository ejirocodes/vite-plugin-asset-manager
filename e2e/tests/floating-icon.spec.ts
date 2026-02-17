import { test, expect } from '@playwright/test'
import { selectors } from '../helpers/selectors'

const HOST_URL = 'http://localhost:4173/'

test.describe('Floating Icon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HOST_URL)
    await page.waitForSelector(selectors.floatingIcon.trigger, { timeout: 10_000 })
  })

  test('floating icon trigger is visible on host page', async ({ page }) => {
    await expect(page.locator(selectors.floatingIcon.trigger)).toBeVisible()
  })

  test('clicking trigger opens the panel', async ({ page }) => {
    await page.locator(selectors.floatingIcon.trigger).click()

    await expect(page.locator(selectors.floatingIcon.panelOpen)).toBeVisible()
    await expect(page.locator(selectors.floatingIcon.iframe)).toBeVisible()
  })

  test('Alt+Shift+A keyboard shortcut toggles panel', async ({ page }) => {
    await expect(page.locator(selectors.floatingIcon.panelOpen)).not.toBeVisible()

    await page.keyboard.press('Alt+Shift+KeyA')
    await expect(page.locator(selectors.floatingIcon.panelOpen)).toBeVisible()

    await page.keyboard.press('Alt+Shift+KeyA')
    await expect(page.locator(selectors.floatingIcon.panelOpen)).not.toBeVisible()
  })

  test('Escape key closes the panel', async ({ page }) => {
    await page.locator(selectors.floatingIcon.trigger).click()
    await expect(page.locator(selectors.floatingIcon.panelOpen)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator(selectors.floatingIcon.panelOpen)).not.toBeVisible()
  })

  test('dashboard loads inside iframe', async ({ page }) => {
    await page.locator(selectors.floatingIcon.trigger).click()
    await expect(page.locator(selectors.floatingIcon.panelOpen)).toBeVisible()

    const iframe = page.frameLocator(selectors.floatingIcon.iframe)
    await expect(iframe.locator('[role="grid"]').first()).toBeVisible({ timeout: 15_000 })
  })
})
