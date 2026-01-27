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
    readFile: vi.fn()
  }
}))

import { ImporterScanner } from '../../src/server/importer-scanner'
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
  extensions: ['.png', '.jpg', '.svg', '.woff', '.json'],
  thumbnails: true,
  thumbnailSize: 200,
  watch: false,
  floatingIcon: true,
  launchEditor: 'code'
}

describe('ImporterScanner', () => {
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
    it('should scan source files for imports', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(mockFg).toHaveBeenCalled()
    })

    it('should initialize watcher when watch option is true', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new ImporterScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      expect(mockChokidar.watch).toHaveBeenCalled()
    })

    it('should not reinitialize if already initialized', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()
      await scanner.init()

      expect(mockFg).toHaveBeenCalledTimes(1)
    })
  })

  describe('getImporters()', () => {
    it('should find ES import statements', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers.length).toBeGreaterThan(0)
      expect(importers[0].importType).toBe('es-import')
    })

    it('should find dynamic imports', async () => {
      mockFg.mockResolvedValue(['src/Component.tsx'])
      mockFs.readFile.mockResolvedValue(`const img = await import('./assets/dynamic.png')`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/dynamic.png')
      expect(importers.some(i => i.importType === 'dynamic-import')).toBe(true)
    })

    it('should find require statements', async () => {
      mockFg.mockResolvedValue(['src/legacy.js'])
      mockFs.readFile.mockResolvedValue(`const img = require('./assets/image.png')`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/image.png')
      expect(importers.some(i => i.importType === 'require')).toBe(true)
    })

    it('should find CSS url() references', async () => {
      mockFg.mockResolvedValue(['src/styles.css'])
      mockFs.readFile.mockResolvedValue(`.hero { background-image: url('./assets/bg.png'); }`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/bg.png')
      expect(importers.some(i => i.importType === 'css-url')).toBe(true)
    })

    it('should find HTML src attributes', async () => {
      mockFg.mockResolvedValue(['src/index.html'])
      mockFs.readFile.mockResolvedValue(`<img src="./images/hero.png" alt="Hero">`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/images/hero.png')
      expect(importers.some(i => i.importType === 'html-src')).toBe(true)
    })

    it('should find HTML href attributes', async () => {
      mockFg.mockResolvedValue(['src/index.html'])
      mockFs.readFile.mockResolvedValue(`<link href="./styles/main.css" rel="stylesheet">`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      // Note: .css is not in ASSET_EXTENSIONS so this won't match
      // Let's test with a valid asset extension
      mockFg.mockResolvedValue(['src/page.html'])
      mockFs.readFile.mockResolvedValue(`<a href="./docs/manual.pdf">Download</a>`)

      const scanner2 = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner2.init()

      // PDF is not in our default extensions, but let's check with json
      mockFg.mockResolvedValue(['src/data.html'])
      mockFs.readFile.mockResolvedValue(`<a href="./data/config.json">Config</a>`)

      const scanner3 = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner3.init()

      const importers = scanner3.getImporters('src/data/config.json')
      expect(importers.some(i => i.importType === 'html-href')).toBe(true)
    })

    it('should return empty array for assets with no importers', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/unused/image.png')
      expect(importers).toEqual([])
    })

    it('should include line and column information', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`// Comment line
import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers[0]).toHaveProperty('line')
      expect(importers[0]).toHaveProperty('column')
      expect(importers[0].line).toBe(2) // Second line
    })

    it('should include code snippet', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers[0].snippet).toContain('import logo')
    })
  })

  describe('path resolution', () => {
    it('should resolve relative imports', async () => {
      mockFg.mockResolvedValue(['src/components/Button.tsx'])
      mockFs.readFile.mockResolvedValue(`import icon from '../assets/icon.svg'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/icon.svg')
      expect(importers.length).toBeGreaterThan(0)
    })

    it('should resolve @/ alias paths', async () => {
      mockFg.mockResolvedValue(['src/components/Header.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from '@/assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers.length).toBeGreaterThan(0)
    })

    it('should resolve absolute paths to public/', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import config from '/data.json'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('public/data.json')
      expect(importers.length).toBeGreaterThan(0)
    })

    it('should ignore external URLs', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`
        import ext1 from 'https://example.com/image.png'
        import ext2 from 'http://example.com/image.png'
        import ext3 from '//example.com/image.png'
      `)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('https://example.com/image.png')
      expect(importers).toEqual([])
    })

    it('should ignore bare module specifiers', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import React from 'react'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('react')
      expect(importers).toEqual([])
    })
  })

  describe('multiple importers', () => {
    it('should track asset imported by multiple files', async () => {
      mockFg.mockResolvedValue(['src/App.tsx', 'src/Header.tsx'])
      mockFs.readFile
        .mockResolvedValueOnce(`import logo from './assets/logo.png'`)
        .mockResolvedValueOnce(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers.length).toBe(2)
    })

    it('should track file importing multiple assets', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`
        import logo from './assets/logo.png'
        import icon from './assets/icon.svg'
        import bg from './assets/bg.jpg'
      `)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      expect(scanner.getImporters('src/assets/logo.png').length).toBe(1)
      expect(scanner.getImporters('src/assets/icon.svg').length).toBe(1)
      expect(scanner.getImporters('src/assets/bg.jpg').length).toBe(1)
    })
  })

  describe('file watching', () => {
    it('should emit change event when source file changes', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const changeSpy = vi.fn()
      scanner.on('change', changeSpy)

      // Update the file content
      mockFs.readFile.mockResolvedValue(`import newLogo from './assets/new-logo.png'`)

      // Simulate file change
      mockWatcher.emit('change', '/project/src/App.tsx')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(changeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'change',
          path: 'src/App.tsx',
          affectedAssets: expect.any(Array)
        })
      )
    })

    it('should update cache when source file is deleted', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      expect(scanner.getImporters('src/assets/logo.png').length).toBe(1)

      // Simulate file deletion
      mockWatcher.emit('unlink', '/project/src/App.tsx')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(scanner.getImporters('src/assets/logo.png').length).toBe(0)
    })

    it('should ignore non-source file changes', async () => {
      mockFg.mockResolvedValue([])

      const scanner = new ImporterScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const changeSpy = vi.fn()
      scanner.on('change', changeSpy)

      // Simulate change to non-source file
      mockWatcher.emit('change', '/project/src/image.png')

      await new Promise(resolve => setTimeout(resolve, 50))

      expect(changeSpy).not.toHaveBeenCalled()
    })
  })

  describe('concurrent scan handling', () => {
    it('should deduplicate concurrent scan requests', async () => {
      let resolveFirst: () => void
      const delayedPromise = new Promise<string[]>(resolve => {
        resolveFirst = () => resolve(['src/App.tsx'])
      })

      mockFg.mockReturnValue(delayedPromise)
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)

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

      const scanner = new ImporterScanner('/project', { ...DEFAULT_OPTIONS, watch: true })
      await scanner.init()

      const closeSpy = vi.spyOn(mockWatcher, 'close')

      scanner.destroy()

      expect(closeSpy).toHaveBeenCalled()
    })
  })

  describe('batch processing', () => {
    it('should process files in batches', async () => {
      // Create 100 files
      const files = Array.from({ length: 100 }, (_, i) => `src/file${i}.tsx`)
      mockFg.mockResolvedValue(files)
      mockFs.readFile.mockResolvedValue(`import logo from './assets/logo.png'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      // All files should have been processed
      const importers = scanner.getImporters('src/assets/logo.png')
      expect(importers.length).toBe(100)
    })
  })

  describe('public path handling', () => {
    it('should handle public/ prefix lookup', async () => {
      mockFg.mockResolvedValue(['src/App.tsx'])
      mockFs.readFile.mockResolvedValue(`import config from '/config.json'`)

      const scanner = new ImporterScanner('/project', DEFAULT_OPTIONS)
      await scanner.init()

      // Should find importers whether looking up with or without public/ prefix
      const importers1 = scanner.getImporters('public/config.json')
      const importers2 = scanner.getImporters('config.json')

      // At least one should have importers
      expect(importers1.length + importers2.length).toBeGreaterThan(0)
    })
  })
})
