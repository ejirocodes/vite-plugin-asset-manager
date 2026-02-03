import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from 'events'
import type { ResolvedOptions, Asset } from '../../packages/core/src/types'

class MockFSWatcher extends EventEmitter {
  async close() {
    this.removeAllListeners()
  }
}

const { mockChokidarWatch, mockFsCreateReadStream, mockFsStat, mockFsReadFile } = vi.hoisted(() => ({
  mockChokidarWatch: vi.fn(),
  mockFsCreateReadStream: vi.fn(),
  mockFsStat: vi.fn(),
  mockFsReadFile: vi.fn()
}))

vi.mock('chokidar', () => ({
  default: {
    watch: mockChokidarWatch
  }
}))

vi.mock('fs', () => ({
  default: {
    createReadStream: mockFsCreateReadStream,
    promises: {
      stat: mockFsStat,
      readFile: mockFsReadFile
    }
  },
  promises: {
    stat: mockFsStat,
    readFile: mockFsReadFile
  },
  createReadStream: mockFsCreateReadStream
}))

import { DuplicateScanner } from '../../packages/core/src/services/duplicate-scanner'

const mockChokidar = { watch: mockChokidarWatch }
const mockFs = {
  createReadStream: mockFsCreateReadStream,
  promises: {
    stat: mockFsStat,
    readFile: mockFsReadFile
  }
}

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

function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'dGVzdC5wbmc',
    name: 'test.png',
    path: 'src/test.png',
    absolutePath: '/project/src/test.png',
    extension: '.png',
    type: 'image',
    size: 1024,
    mtime: Date.now(),
    directory: 'src',
    ...overrides
  }
}

describe('DuplicateScanner', () => {
  let mockWatcher: MockFSWatcher
  let scanner: DuplicateScanner

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatcher = new MockFSWatcher()
    mockChokidar.watch.mockReturnValue(mockWatcher as unknown as chokidar.FSWatcher)
    scanner = new DuplicateScanner('/project', DEFAULT_OPTIONS)
  })

  afterEach(() => {
    mockWatcher.removeAllListeners()
    scanner.destroy()
  })

  describe('init()', () => {
    it('should initialize without error', async () => {
      await expect(scanner.init()).resolves.not.toThrow()
    })

    it('should only initialize once', async () => {
      await scanner.init()
      await scanner.init()
      // Should not throw and be idempotent
    })
  })

  describe('scanAssets()', () => {
    it('should compute hashes for assets', async () => {
      const content = Buffer.from('test content')
      mockFs.promises.stat.mockResolvedValue({
        size: content.length,
        mtimeMs: Date.now()
      } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const asset = createMockAsset()
      await scanner.scanAssets([asset])

      const info = scanner.getDuplicateInfo(asset.path)
      expect(info.hash).toBeTruthy()
      expect(info.hash.length).toBe(32) // MD5 hex length
    })

    it('should identify duplicates with same content', async () => {
      const content = Buffer.from('identical content')
      mockFs.promises.stat.mockResolvedValue({
        size: content.length,
        mtimeMs: Date.now()
      } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const asset1 = createMockAsset({ path: 'src/image1.png', absolutePath: '/project/src/image1.png' })
      const asset2 = createMockAsset({ path: 'src/image2.png', absolutePath: '/project/src/image2.png' })

      await scanner.scanAssets([asset1, asset2])

      const info1 = scanner.getDuplicateInfo(asset1.path)
      const info2 = scanner.getDuplicateInfo(asset2.path)

      expect(info1.hash).toBe(info2.hash)
      expect(info1.duplicatesCount).toBe(1)
      expect(info2.duplicatesCount).toBe(1)
    })

    it('should not mark unique files as duplicates', async () => {
      const content1 = Buffer.from('content 1')
      const content2 = Buffer.from('different content 2')

      mockFs.promises.stat.mockResolvedValue({
        size: 100,
        mtimeMs: Date.now()
      } as any)

      let callCount = 0
      mockFs.promises.readFile.mockImplementation(() => {
        callCount++
        return Promise.resolve(callCount === 1 ? content1 : content2)
      })

      const asset1 = createMockAsset({ path: 'src/unique1.png', absolutePath: '/project/src/unique1.png' })
      const asset2 = createMockAsset({ path: 'src/unique2.png', absolutePath: '/project/src/unique2.png' })

      await scanner.scanAssets([asset1, asset2])

      const info1 = scanner.getDuplicateInfo(asset1.path)
      const info2 = scanner.getDuplicateInfo(asset2.path)

      expect(info1.hash).not.toBe(info2.hash)
      expect(info1.duplicatesCount).toBe(0)
      expect(info2.duplicatesCount).toBe(0)
    })
  })

  describe('getDuplicateInfo()', () => {
    it('should return empty info for unknown path', () => {
      const info = scanner.getDuplicateInfo('unknown/path.png')
      expect(info.hash).toBe('')
      expect(info.duplicatesCount).toBe(0)
    })
  })

  describe('getDuplicatesByHash()', () => {
    it('should return all paths with matching hash', async () => {
      const content = Buffer.from('shared content')
      mockFs.promises.stat.mockResolvedValue({
        size: content.length,
        mtimeMs: Date.now()
      } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const asset1 = createMockAsset({ path: 'src/dup1.png', absolutePath: '/project/src/dup1.png' })
      const asset2 = createMockAsset({ path: 'src/dup2.png', absolutePath: '/project/src/dup2.png' })
      const asset3 = createMockAsset({ path: 'public/dup3.png', absolutePath: '/project/public/dup3.png' })

      await scanner.scanAssets([asset1, asset2, asset3])

      const info = scanner.getDuplicateInfo(asset1.path)
      const duplicates = scanner.getDuplicatesByHash(info.hash)

      expect(duplicates).toHaveLength(3)
      expect(duplicates).toContain(asset1.path)
      expect(duplicates).toContain(asset2.path)
      expect(duplicates).toContain(asset3.path)
    })

    it('should return empty array for unknown hash', () => {
      const duplicates = scanner.getDuplicatesByHash('unknownhash')
      expect(duplicates).toHaveLength(0)
    })
  })

  describe('getStats()', () => {
    it('should return correct duplicate statistics', async () => {
      const content = Buffer.from('duplicate content')
      mockFs.promises.stat.mockResolvedValue({
        size: content.length,
        mtimeMs: Date.now()
      } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const asset1 = createMockAsset({ path: 'src/a.png', absolutePath: '/project/src/a.png' })
      const asset2 = createMockAsset({ path: 'src/b.png', absolutePath: '/project/src/b.png' })

      await scanner.scanAssets([asset1, asset2])

      const stats = scanner.getStats()
      expect(stats.duplicateGroups).toBe(1)
      expect(stats.duplicateFiles).toBe(2)
    })

    it('should return zero stats when no duplicates', async () => {
      const content1 = Buffer.from('unique 1')
      const content2 = Buffer.from('unique 2')

      mockFs.promises.stat.mockResolvedValue({
        size: 100,
        mtimeMs: Date.now()
      } as any)

      let callCount = 0
      mockFs.promises.readFile.mockImplementation(() => {
        callCount++
        return Promise.resolve(callCount === 1 ? content1 : content2)
      })

      const asset1 = createMockAsset({ path: 'src/u1.png', absolutePath: '/project/src/u1.png' })
      const asset2 = createMockAsset({ path: 'src/u2.png', absolutePath: '/project/src/u2.png' })

      await scanner.scanAssets([asset1, asset2])

      const stats = scanner.getStats()
      expect(stats.duplicateGroups).toBe(0)
      expect(stats.duplicateFiles).toBe(0)
    })
  })

  describe('enrichAssetsWithDuplicateInfo()', () => {
    it('should populate asset fields with duplicate info', async () => {
      const content = Buffer.from('content to hash')
      mockFs.promises.stat.mockResolvedValue({
        size: content.length,
        mtimeMs: Date.now()
      } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const assets = [
        createMockAsset({ path: 'src/e1.png', absolutePath: '/project/src/e1.png' }),
        createMockAsset({ path: 'src/e2.png', absolutePath: '/project/src/e2.png' })
      ]

      await scanner.scanAssets(assets)
      scanner.enrichAssetsWithDuplicateInfo(assets)

      expect(assets[0].contentHash).toBeTruthy()
      expect(assets[0].duplicatesCount).toBe(1)
      expect(assets[1].contentHash).toBeTruthy()
      expect(assets[1].duplicatesCount).toBe(1)
      expect(assets[0].contentHash).toBe(assets[1].contentHash)
    })
  })

  describe('caching', () => {
    it('should use cached hash when file unchanged', async () => {
      const content = Buffer.from('cached content')
      const mtime = Date.now()
      const size = content.length

      mockFs.promises.stat.mockResolvedValue({ size, mtimeMs: mtime } as any)
      mockFs.promises.readFile.mockResolvedValue(content)

      const asset = createMockAsset({ mtime, size })

      // First scan
      await scanner.scanAssets([asset])
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1)

      // Second scan with same mtime/size should use cache
      await scanner.scanAssets([asset])
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy()', () => {
    it('should clean up resources', () => {
      scanner.initWatcher()
      scanner.destroy()
      // Should not throw
    })
  })
})
