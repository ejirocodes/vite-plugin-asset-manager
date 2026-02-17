import { test, expect } from '../helpers/fixtures'
import { selectors } from '../helpers/selectors'

test.describe('Dashboard', () => {
  test('loads and displays asset groups', async ({ dashboardPage: page }) => {
    const gridCells = page.locator(selectors.dashboard.gridCell)
    await expect(gridCells.first()).toBeVisible()

    const count = await gridCells.count()
    expect(count).toBeGreaterThan(0)
  })

  test('displays directory group headers', async ({ dashboardPage: page }) => {
    await expect(page.getByText('src/assets')).toBeVisible()
    await expect(page.getByText('public')).toBeVisible()
  })

  test('search filters assets', async ({ dashboardPage: page }) => {
    const searchInput = page.locator(selectors.dashboard.searchInput)
    await searchInput.fill('svelte')

    await page.waitForTimeout(500)

    await expect(page.getByText('svelte.svg')).toBeVisible()
    await expect(page.getByText('banner.png')).not.toBeVisible()
  })

  test('search with no results shows empty state', async ({ dashboardPage: page }) => {
    const searchInput = page.locator(selectors.dashboard.searchInput)
    await searchInput.fill('nonexistent-file-xyz-zzz')

    // Wait for search to complete and grid to empty
    await expect(page.locator(selectors.dashboard.gridCell)).toHaveCount(0, { timeout: 5_000 })
  })

  test('type filter shows only matching assets', async ({ dashboardPage: page }) => {
    // Use the navigation sidebar button, not the stat badge
    await page.getByRole('navigation').getByRole('button', { name: /images/i }).click()

    await page.waitForTimeout(300)

    const gridCells = page.locator(selectors.dashboard.gridCell)
    await expect(gridCells.first()).toBeVisible()
  })

  test('clicking asset card opens preview panel', async ({ dashboardPage: page }) => {
    const firstCard = page.locator(selectors.dashboard.gridCell).first()
    await firstCard.click()

    const preview = page.locator(selectors.dashboard.previewPanel)
    await expect(preview).toBeVisible()

    const panelHeader = preview.locator('h2')
    await expect(panelHeader).toBeVisible()
    const headerText = await panelHeader.textContent()
    expect(headerText?.length).toBeGreaterThan(0)
  })

  test('preview panel closes with close button', async ({ dashboardPage: page }) => {
    await page.locator(selectors.dashboard.gridCell).first().click()
    const preview = page.locator(selectors.dashboard.previewPanel)
    await expect(preview).toBeVisible()

    await page.locator(selectors.dashboard.closePreview).click()
    await expect(preview).not.toBeVisible()
  })

  test('preview panel closes with Escape key', async ({ dashboardPage: page }) => {
    await page.locator(selectors.dashboard.gridCell).first().click()
    await expect(page.locator(selectors.dashboard.previewPanel)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator(selectors.dashboard.previewPanel)).not.toBeVisible()
  })
})
