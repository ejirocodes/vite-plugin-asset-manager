import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'
import type { ResolvedOptions } from '../../src/shared/types'

class MockFSWatcher extends EventEmitter {
  async close() {
    this.removeAllListeners()
  }
}

vi.mock('fast-glob', () => ({
  default: vi.fn()
}))

vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn()
  }
}))

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn()
  }
}))

import { AssetScanner } from '../../src/server/scanner'
import fg from 'fast-glob'
import chokidar from 'chokidar'
import fs from 'fs/promises'

const mockFg = vi.mocked(fg)
const mockChokidar = vi.mocked(chokidar)
const mockFs = vi.mocked(fs)

const DEFAULT_OPTIONS: ResolvedOptions = {
  base: '/__asset_manager__',
  include: ['src', 'public'],
  exclude: ['node_modules', '.git', 'dist'],
  extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.woff', '.woff2', '.ttf', '.json', '.md'],
  thumbnails: true,
  thumbnailSize: 200,
  watch: false,
  floatingIcon: true,
  launchEditor: 'code'
}

describe('AssetScanner', () => {
  let mockWatcher: MockFSWatcher

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatcher = new MockFSWatcher()
    mockChokidar.watch.mockReturnValue(mockWatcher as unknown as chokidar.FSWatcher)
  })

  afterEach(() => {
    mockWatcher.removeAllListeners()
  })

  describe('init()', () => {
    it('should scan for assets on initialization', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/assets/logo.png', stats: { size: 2048, mtimeMs: Date.now() } },
        { path: 'public/image.jpg', stats: { size: 4096, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(mockFg).toHaveBeenCalled()
      expect(scanner.getAssets()).toHaveLength(2)
    })

    it('should initialize watcher when watch option is true', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      expect(mockChokidar.watch).toHaveBeenCalled()
    })

    it('should not initialize watcher when watch option is false', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: false })
      await scanner.init()

      expect(mockChokidar.watch).not.toHaveBeenCalled()
    })
  })

  describe('getAssets()', () => {
    it('should return all scanned assets', async () => {
      const mtime = Date.now()
      mockFg.mockResolvedValue([
        { path: 'src/assets/logo.png', stats: { size: 2048, mtimeMs: mtime } },
        { path: 'public/hero.jpg', stats: { size: 4096, mtimeMs: mtime } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const assets = scanner.getAssets()
      expect(assets).toHaveLength(2)
      expect(assets[0]).toMatchObject({
        name: 'logo.png',
        extension: '.png',
        type: 'image'
      })
    })

    it('should generate base64url encoded IDs', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/image.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const assets = scanner.getAssets()
      expect(assets[0].id).toBe(Buffer.from('src/image.png').toString('base64url'))
    })
  })

  describe('getGroupedAssets()', () => {
    it('should group assets by directory', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/assets/logo.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'src/assets/icon.svg', stats: { size: 512, mtimeMs: Date.now() } },
        { path: 'public/hero.jpg', stats: { size: 2048, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const groups = scanner.getGroupedAssets()
      expect(groups).toHaveLength(2)

      const srcGroup = groups.find(g => g.directory === 'src/assets')
      expect(srcGroup?.count).toBe(2)

      const publicGroup = groups.find(g => g.directory === 'public')
      expect(publicGroup?.count).toBe(1)
    })

    it('should sort groups by directory name', async () => {
      mockFg.mockResolvedValue([
        { path: 'public/a.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'src/b.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'assets/c.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const groups = scanner.getGroupedAssets()
      expect(groups[0].directory).toBe('assets')
      expect(groups[1].directory).toBe('public')
      expect(groups[2].directory).toBe('src')
    })

    it('should sort assets within groups by name', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/zebra.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'src/alpha.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'src/beta.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const groups = scanner.getGroupedAssets()
      expect(groups[0].assets[0].name).toBe('alpha.png')
      expect(groups[0].assets[1].name).toBe('beta.png')
      expect(groups[0].assets[2].name).toBe('zebra.png')
    })
  })

  describe('search()', () => {
    beforeEach(async () => {
      mockFg.mockResolvedValue([
        { path: 'src/logo.png', stats: { size: 1024, mtimeMs: Date.now() } },
        { path: 'src/hero-image.jpg', stats: { size: 2048, mtimeMs: Date.now() } },
        { path: 'public/banner.svg', stats: { size: 512, mtimeMs: Date.now() } }
      ] as fg.Entry[])
    })

    it('should filter assets by name', async () => {
      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const results = scanner.search('logo')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('logo.png')
    })

    it('should filter assets by path', async () => {
      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const results = scanner.search('public')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('banner.svg')
    })

    it('should return all assets for empty query', async () => {
      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const results = scanner.search('')
      expect(results).toHaveLength(3)
    })

    it('should be case-insensitive', async () => {
      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const results = scanner.search('LOGO')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('logo.png')
    })

    it('should handle whitespace in query', async () => {
      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const results = scanner.search('  logo  ')
      expect(results).toHaveLength(1)
    })
  })

  describe('getAsset()', () => {
    it('should return asset by relative path', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/logo.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const asset = scanner.getAsset('src/logo.png')
      expect(asset).toBeDefined()
      expect(asset?.name).toBe('logo.png')
    })

    it('should return undefined for non-existent path', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const asset = scanner.getAsset('nonexistent.png')
      expect(asset).toBeUndefined()
    })
  })

  describe('asset type detection', () => {
    it('should correctly identify image types', async () => {
      mockFg.mockResolvedValue([
        { path: 'test.png', stats: { size: 100, mtimeMs: Date.now() } },
        { path: 'test.jpg', stats: { size: 100, mtimeMs: Date.now() } },
        { path: 'test.svg', stats: { size: 100, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const assets = scanner.getAssets()
      assets.forEach(asset => {
        expect(asset.type).toBe('image')
      })
    })

    it('should correctly identify video types', async () => {
      mockFg.mockResolvedValue([
        { path: 'test.mp4', stats: { size: 100, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(scanner.getAssets()[0].type).toBe('video')
    })

    it('should correctly identify font types', async () => {
      mockFg.mockResolvedValue([
        { path: 'test.woff', stats: { size: 100, mtimeMs: Date.now() } },
        { path: 'test.woff2', stats: { size: 100, mtimeMs: Date.now() } },
        { path: 'test.ttf', stats: { size: 100, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      scanner.getAssets().forEach(asset => {
        expect(asset.type).toBe('font')
      })
    })

    it('should correctly identify data types', async () => {
      mockFg.mockResolvedValue([
        { path: 'test.json', stats: { size: 100, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(scanner.getAssets()[0].type).toBe('data')
    })

    it('should correctly identify text types', async () => {
      mockFg.mockResolvedValue([
        { path: 'test.md', stats: { size: 100, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(scanner.getAssets()[0].type).toBe('text')
    })
  })

  describe('file watching', () => {
    it('should emit change event when file is added', async () => {
      mockFg.mockResolvedValue([])
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtimeMs: Date.now()
      } as import('fs').Stats)

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const changeSpy = vi.fn()
      scanner.on('change', changeSpy)

      // Simulate file add
      mockWatcher.emit('add', '/project/src/new-image.png')

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'add', path: 'src/new-image.png' })
      )
    })

    it('should emit change event when file is deleted', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/logo.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const changeSpy = vi.fn()
      scanner.on('change', changeSpy)

      // Simulate file unlink
      mockWatcher.emit('unlink', '/project/src/logo.png')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'unlink', path: 'src/logo.png' })
      )
    })

    it('should ignore files with unsupported extensions', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const changeSpy = vi.fn()
      scanner.on('change', changeSpy)

      // Simulate adding unsupported file type
      mockWatcher.emit('add', '/project/src/file.xyz')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(changeSpy).not.toHaveBeenCalled()
    })

    it('should update cache when file changes', async () => {
      mockFg.mockResolvedValue([
        { path: 'src/logo.png', stats: { size: 1024, mtimeMs: Date.now() } }
      ] as fg.Entry[])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const newMtime = Date.now() + 1000
      mockFs.stat.mockResolvedValue({
        size: 2048,
        mtimeMs: newMtime
      } as import('fs').Stats)

      // Simulate file change
      mockWatcher.emit('change', '/project/src/logo.png')

      await new Promise(resolve => setTimeout(resolve, 50))

      const asset = scanner.getAsset('src/logo.png')
      expect(asset?.size).toBe(2048)
    })
  })

  describe('concurrent scan handling', () => {
    it('should deduplicate concurrent scan requests', async () => {
      let resolveFirst: () => void
      const delayedPromise = new Promise<fg.Entry[]>(resolve => {
        resolveFirst = () => resolve([
          { path: 'src/image.png', stats: { size: 1024, mtimeMs: Date.now() } }
        ] as fg.Entry[])
      })

      mockFg.mockReturnValue(delayedPromise)

      const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)

      // Start two scans concurrently
      const scan1 = scanner.scan()
      const scan2 = scanner.scan()

      // Resolve the first promise
      resolveFirst!()

      await Promise.all([scan1, scan2])

      // fast-glob should only be called once
      expect(mockFg).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy()', () => {
    it('should close the file watcher', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new AssetScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const closeSpy = vi.spyOn(mockWatcher, 'close')

      scanner.destroy()

      expect(closeSpy).toHaveBeenCalled()
    })
  })
})
