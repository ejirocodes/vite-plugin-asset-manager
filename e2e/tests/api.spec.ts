import { test, expect } from '@playwright/test'
import { API_BASE } from '../helpers/selectors'

const BASE = `http://localhost:4173${API_BASE}`

test.describe('API', () => {
  test('GET /assets/grouped returns grouped assets', async ({ request }) => {
    const response = await request.get(`${BASE}/assets/grouped`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('groups')
    expect(data).toHaveProperty('total')
    expect(data.total).toBeGreaterThan(0)
    expect(Array.isArray(data.groups)).toBe(true)

    const group = data.groups[0]
    expect(group).toHaveProperty('directory')
    expect(group).toHaveProperty('count')
    expect(group).toHaveProperty('assets')
    expect(group.count).toBeGreaterThan(0)
  })

  test('GET /assets/grouped?type=image filters by type', async ({ request }) => {
    const response = await request.get(`${BASE}/assets/grouped?type=image`)
    const data = await response.json()

    for (const group of data.groups) {
      for (const asset of group.assets) {
        expect(asset.type).toBe('image')
      }
    }
  })

  test('GET /search returns matching assets', async ({ request }) => {
    const response = await request.get(`${BASE}/search?q=svelte`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('assets')
    expect(data).toHaveProperty('query', 'svelte')

    const names = data.assets.map((a: { name: string }) => a.name)
    expect(names).toContain('svelte.svg')
  })

  test('GET /stats returns asset statistics', async ({ request }) => {
    const response = await request.get(`${BASE}/stats`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('byType')
    expect(data).toHaveProperty('totalSize')
    expect(data.total).toBeGreaterThan(0)
    expect(data.byType).toHaveProperty('image')
  })

  test('GET /thumbnail returns image data', async ({ request }) => {
    const response = await request.get(`${BASE}/thumbnail?path=src/assets/svelte.svg`)
    expect(response.ok()).toBeTruthy()

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('image/')
  })

  test('GET /events establishes SSE connection', async ({ page }) => {
    const sseResponse = await page.evaluate(async (url) => {
      return new Promise<{ connected: boolean }>((resolve) => {
        const es = new EventSource(url)
        const timeout = setTimeout(() => {
          es.close()
          resolve({ connected: false })
        }, 5_000)
        es.onmessage = (event) => {
          clearTimeout(timeout)
          es.close()
          const data = JSON.parse(event.data)
          resolve({ connected: data.type === 'connected' })
        }
        es.onerror = () => {
          clearTimeout(timeout)
          es.close()
          resolve({ connected: false })
        }
      })
    }, `${BASE}/events`)

    expect(sseResponse.connected).toBe(true)
  })

  test('GET /importers returns importer data', async ({ request }) => {
    const response = await request.get(`${BASE}/importers?path=src/assets/svelte.svg`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('importers')
    expect(data).toHaveProperty('total')
    expect(data.total).toBeGreaterThan(0)
  })
})
