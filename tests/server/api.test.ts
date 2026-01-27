import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import { EventEmitter } from 'stream'
import type { Asset, AssetGroup, Importer } from '../../src/shared/types'
import { createMockAsset } from '../setup'

vi.mock('fs', () => ({
  default: {
    createReadStream: vi.fn(),
    promises: {
      access: vi.fn()
    },
    constants: {
      R_OK: 4
    }
  }
}))

vi.mock('../../src/server/editor-launcher', () => ({
  launchEditor: vi.fn()
}))

import { createApiRouter, broadcastSSE } from '../../src/server/api'
import fs from 'fs'
import { launchEditor } from '../../src/server/editor-launcher'

const mockFs = vi.mocked(fs)
const mockLaunchEditor = vi.mocked(launchEditor)

function createMockRequest(
  url: string,
  method: string = 'GET'
): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage
  req.url = url
  req.method = method
  return req
}

function createMockResponse(): ServerResponse & {
  _data: string
  _headers: Record<string, string | number>
  _statusCode: number
} {
  const res = new EventEmitter() as ServerResponse & {
    _data: string
    _headers: Record<string, string | number>
    _statusCode: number
  }
  res._data = ''
  res._headers = {}
  res._statusCode = 200

  res.setHeader = vi.fn((name: string, value: string | number) => {
    res._headers[name.toLowerCase()] = value
    return res
  })
  res.writeHead = vi.fn((statusCode: number, headers?: Record<string, string>) => {
    res._statusCode = statusCode
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => {
        res._headers[k.toLowerCase()] = v
      })
    }
    return res
  })
  res.write = vi.fn((data: string) => {
    res._data += data
    return true
  })
  res.end = vi.fn((data?: string) => {
    if (data) res._data += data
    return res
  })

  Object.defineProperty(res, 'statusCode', {
    get: () => res._statusCode,
    set: (code: number) => {
      res._statusCode = code
    }
  })

  return res
}

function createMockScanner(assets: Asset[] = []) {
  return {
    getAssets: vi.fn().mockReturnValue(assets),
    getGroupedAssets: vi.fn().mockReturnValue(
      assets.length > 0
        ? [
            {
              directory: assets[0].directory,
              assets,
              count: assets.length
            } as AssetGroup
          ]
        : []
    ),
    search: vi.fn().mockImplementation((query: string) => {
      if (!query) return assets
      return assets.filter(a => a.name.includes(query) || a.path.includes(query))
    })
  }
}

function createMockImporterScanner(importers: Importer[] = []) {
  return {
    getImporters: vi.fn().mockReturnValue(importers)
  }
}

function createMockThumbnailService() {
  return {
    getThumbnail: vi.fn().mockResolvedValue(Buffer.from('thumbnail-data'))
  }
}

describe('API Router', () => {
  const root = '/project'
  const basePath = '/__asset_manager__'
  const editor = 'code'

  let mockScanner: ReturnType<typeof createMockScanner>
  let mockImporterScanner: ReturnType<typeof createMockImporterScanner>
  let mockThumbnailService: ReturnType<typeof createMockThumbnailService>

  const testAsset: Asset = {
    id: Buffer.from('src/logo.png').toString('base64url'),
    name: 'logo.png',
    path: 'src/logo.png',
    absolutePath: '/project/src/logo.png',
    extension: '.png',
    type: 'image',
    size: 1024,
    mtime: Date.now(),
    directory: 'src'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockScanner = createMockScanner([testAsset])
    mockImporterScanner = createMockImporterScanner()
    mockThumbnailService = createMockThumbnailService()
  })

  describe('GET /assets', () => {
    it('should return all assets', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/assets`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.assets).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it('should filter by directory', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/assets?directory=src`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      const data = JSON.parse(res._data)
      expect(data.assets).toHaveLength(1)
    })

    it('should filter by type', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/assets?type=image`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      const data = JSON.parse(res._data)
      expect(data.assets).toHaveLength(1)
    })
  })

  describe('GET /assets/grouped', () => {
    it('should return grouped assets', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/assets/grouped`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      const data = JSON.parse(res._data)
      expect(data.groups).toBeInstanceOf(Array)
      expect(data.total).toBeDefined()
    })
  })

  describe('GET /search', () => {
    it('should search assets by query', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/search?q=logo`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(mockScanner.search).toHaveBeenCalledWith('logo')
      const data = JSON.parse(res._data)
      expect(data.query).toBe('logo')
    })

    it('should handle empty query', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/search`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(mockScanner.search).toHaveBeenCalledWith('')
    })
  })

  describe('GET /thumbnail', () => {
    it('should return thumbnail for supported image', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/thumbnail?path=src/logo.png`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(mockThumbnailService.getThumbnail).toHaveBeenCalled()
      expect(res._headers['content-type']).toBe('image/jpeg')
      expect(res._headers['cache-control']).toBe('public, max-age=31536000')
    })

    it('should return 400 for missing path', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/thumbnail`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(400)
    })

    it('should return 403 for path traversal attempt', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/thumbnail?path=../../../etc/passwd`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(403)
    })

    it('should serve SVG files directly', async () => {
      const mockStream = new EventEmitter()
      ;(mockStream as any).pipe = vi.fn()
      mockFs.createReadStream.mockReturnValue(mockStream as any)

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/thumbnail?path=src/icon.svg`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('image/svg+xml')
      expect(mockThumbnailService.getThumbnail).not.toHaveBeenCalled()
    })
  })

  describe('GET /file', () => {
    it('should serve file with correct MIME type', async () => {
      mockFs.promises.access.mockResolvedValue(undefined)
      const mockStream = new EventEmitter()
      ;(mockStream as any).pipe = vi.fn()
      mockFs.createReadStream.mockReturnValue(mockStream as any)

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/file?path=src/data.json`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      expect(res._headers['cache-control']).toBe('public, max-age=3600')
    })

    it('should return 400 for missing path', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/file`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(400)
    })

    it('should return 403 for path traversal', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/file?path=../../../etc/passwd`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(403)
    })

    it('should return 404 for non-existent file', async () => {
      mockFs.promises.access.mockRejectedValue(new Error('ENOENT'))

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/file?path=src/nonexistent.txt`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(404)
    })
  })

  describe('GET /stats', () => {
    it('should return asset statistics', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/stats`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      const data = JSON.parse(res._data)
      expect(data.total).toBe(1)
      expect(data.byType).toBeDefined()
      expect(data.byType.image).toBe(1)
      expect(data.totalSize).toBe(1024)
      expect(data.directories).toBe(1)
    })
  })

  describe('GET /importers', () => {
    it('should return importers for asset', async () => {
      const mockImporter: Importer = {
        filePath: 'src/App.tsx',
        absolutePath: '/project/src/App.tsx',
        line: 5,
        column: 1,
        importType: 'es-import',
        snippet: "import logo from './assets/logo.png'"
      }
      mockImporterScanner.getImporters.mockReturnValue([mockImporter])

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/importers?path=src/logo.png`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      const data = JSON.parse(res._data)
      expect(data.importers).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it('should return 400 for missing path', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/importers`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(400)
    })
  })

  describe('POST /open-in-editor', () => {
    it('should open file in editor', async () => {
      mockFs.promises.access.mockResolvedValue(undefined)
      mockLaunchEditor.mockResolvedValue(undefined)

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(
        `${basePath}/api/open-in-editor?file=src/App.tsx&line=10&column=5`,
        'POST'
      )
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(mockLaunchEditor).toHaveBeenCalledWith(
        '/project/src/App.tsx',
        10,
        5,
        'code'
      )
      const data = JSON.parse(res._data)
      expect(data.success).toBe(true)
    })

    it('should return 405 for non-POST requests', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/open-in-editor?file=src/App.tsx`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(405)
    })

    it('should return 400 for missing file parameter', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/open-in-editor`, 'POST')
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(400)
    })

    it('should return 403 for path traversal', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(
        `${basePath}/api/open-in-editor?file=../../../etc/passwd`,
        'POST'
      )
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(403)
    })

    it('should return 404 for non-existent file', async () => {
      mockFs.promises.access.mockRejectedValue(new Error('ENOENT'))

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(
        `${basePath}/api/open-in-editor?file=nonexistent.tsx`,
        'POST'
      )
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(404)
    })

    it('should handle editor launch error', async () => {
      mockFs.promises.access.mockResolvedValue(undefined)
      mockLaunchEditor.mockRejectedValue(new Error('Editor not found'))

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(
        `${basePath}/api/open-in-editor?file=src/App.tsx`,
        'POST'
      )
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._statusCode).toBe(500)
      const data = JSON.parse(res._data)
      expect(data.error).toBe('Editor not found')
    })
  })

  describe('GET /events (SSE)', () => {
    it('should set up SSE connection', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/events`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('text/event-stream')
      expect(res._headers['cache-control']).toBe('no-cache')
      expect(res._headers['connection']).toBe('keep-alive')
      expect(res._data).toContain('connected')
    })
  })

  describe('broadcastSSE', () => {
    it('should broadcast to all connected clients', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      // Connect a client
      const req = createMockRequest(`${basePath}/api/events`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      // Clear initial connection message
      res._data = ''

      // Broadcast message
      broadcastSSE('asset-manager:update', { type: 'add', path: 'src/new.png' })

      expect(res._data).toContain('asset-manager:update')
      expect(res._data).toContain('new.png')
    })
  })

  describe('Unknown routes', () => {
    it('should call next() for unknown routes', async () => {
      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/unknown`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle scanner errors gracefully', async () => {
      // When scanner returns empty array, it should still work
      mockScanner.getAssets.mockReturnValue([])

      const router = createApiRouter(
        mockScanner as any,
        mockImporterScanner as any,
        mockThumbnailService as any,
        root,
        basePath,
        editor
      )

      const req = createMockRequest(`${basePath}/api/assets`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.assets).toEqual([])
      expect(data.total).toBe(0)
    })
  })

  describe('GET /assets/grouped?unused=true', () => {
    it('should return only unused assets', async () => {
      const assets = [
        createMockAsset({ path: 'src/used.png', importersCount: 3 }),
        createMockAsset({ path: 'src/unused1.png', importersCount: 0 }),
        createMockAsset({ path: 'public/unused2.jpg', importersCount: 0 }),
        createMockAsset({ path: 'public/used.svg', importersCount: 1 })
      ]

      mockScanner.getGroupedAssets.mockReturnValue([
        { directory: 'src', assets: [assets[0], assets[1]], count: 2 },
        { directory: 'public', assets: [assets[2], assets[3]], count: 2 }
      ])

      const router = createApiRouter(
        mockScanner,
        mockImporterScanner,
        mockThumbnailService,
        '/project',
        basePath,
        'code'
      )

      const req = createMockRequest(`${basePath}/api/assets/grouped?unused=true`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.groups).toHaveLength(2)
      expect(data.groups[0].assets).toHaveLength(1)
      expect(data.groups[0].assets[0].path).toBe('src/unused1.png')
      expect(data.groups[1].assets).toHaveLength(1)
      expect(data.groups[1].assets[0].path).toBe('public/unused2.jpg')
      expect(data.total).toBe(2)
    })

    it('should combine type and unused filters', async () => {
      const assets = [
        createMockAsset({ path: 'src/used.png', type: 'image', importersCount: 3 }),
        createMockAsset({ path: 'src/unused-image.png', type: 'image', importersCount: 0 }),
        createMockAsset({ path: 'src/unused-video.mp4', type: 'video', importersCount: 0 }),
        createMockAsset({ path: 'public/unused-image.jpg', type: 'image', importersCount: 0 })
      ]

      mockScanner.getGroupedAssets.mockReturnValue([
        { directory: 'src', assets: [assets[0], assets[1], assets[2]], count: 3 },
        { directory: 'public', assets: [assets[3]], count: 1 }
      ])

      const router = createApiRouter(
        mockScanner,
        mockImporterScanner,
        mockThumbnailService,
        '/project',
        basePath,
        'code'
      )

      const req = createMockRequest(`${basePath}/api/assets/grouped?type=image&unused=true`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.groups).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.groups[0].assets[0].path).toBe('src/unused-image.png')
      expect(data.groups[1].assets[0].path).toBe('public/unused-image.jpg')
    })

    it('should remove empty groups after filtering', async () => {
      const assets = [
        createMockAsset({ path: 'src/used.png', importersCount: 3 }),
        createMockAsset({ path: 'public/unused.jpg', importersCount: 0 })
      ]

      mockScanner.getGroupedAssets.mockReturnValue([
        { directory: 'src', assets: [assets[0]], count: 1 },
        { directory: 'public', assets: [assets[1]], count: 1 }
      ])

      const router = createApiRouter(
        mockScanner,
        mockImporterScanner,
        mockThumbnailService,
        '/project',
        basePath,
        'code'
      )

      const req = createMockRequest(`${basePath}/api/assets/grouped?unused=true`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.groups).toHaveLength(1)
      expect(data.groups[0].directory).toBe('public')
    })
  })

  describe('GET /stats with unused count', () => {
    it('should include unused count in stats', async () => {
      const assets = [
        createMockAsset({ type: 'image', importersCount: 3 }),
        createMockAsset({ type: 'image', importersCount: 0 }),
        createMockAsset({ type: 'video', importersCount: 0 }),
        createMockAsset({ type: 'image', importersCount: 1 })
      ]

      mockScanner.getAssets.mockReturnValue(assets)

      const router = createApiRouter(
        mockScanner,
        mockImporterScanner,
        mockThumbnailService,
        '/project',
        basePath,
        'code'
      )

      const req = createMockRequest(`${basePath}/api/stats`)
      const res = createMockResponse()
      const next = vi.fn()

      await router(req, res, next)

      expect(res._headers['content-type']).toBe('application/json')
      const data = JSON.parse(res._data)
      expect(data.unused).toBe(2)
      expect(data.total).toBe(4)
    })
  })
})
