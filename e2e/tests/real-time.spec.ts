import { test, expect } from '../helpers/fixtures'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLAYGROUND_DIR = path.resolve(__dirname, '../../playgrounds/svelte')
const TEST_ASSET = path.join(PLAYGROUND_DIR, 'src/assets/e2e-test-file.txt')

test.describe('Real-Time Updates', () => {
  test.afterEach(async () => {
    try {
      fs.unlinkSync(TEST_ASSET)
    } catch {
      // File may not exist
    }
  })

  test('new file appears in dashboard after creation', async ({ dashboardPage: page }) => {
    fs.writeFileSync(TEST_ASSET, 'E2E test content')

    await expect(page.getByText('e2e-test-file.txt')).toBeVisible({ timeout: 5_000 })
  })

  test('deleted file disappears from dashboard', async ({ dashboardPage: page }) => {
    fs.writeFileSync(TEST_ASSET, 'E2E test content')
    await expect(page.getByText('e2e-test-file.txt')).toBeVisible({ timeout: 5_000 })

    fs.unlinkSync(TEST_ASSET)

    await expect(page.getByText('e2e-test-file.txt')).not.toBeVisible({ timeout: 5_000 })
  })
})
