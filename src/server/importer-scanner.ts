import { EventEmitter } from 'events'
import fg from 'fast-glob'
import path from 'path'
import fs from 'fs/promises'
import chokidar from 'chokidar'
import type { Importer, ImportType, ResolvedOptions } from '../shared/types.js'

export interface ImporterScannerEvents {
  change: [{ event: string; path: string; affectedAssets: string[] }]
}

/** Source file extensions to scan for imports */
const SOURCE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'css', 'scss', 'less', 'html']

/** Asset extensions to look for in imports */
const ASSET_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'avif',
  'ico',
  'bmp',
  'tiff',
  'tif',
  'heic',
  'heif',
  'mp4',
  'webm',
  'ogg',
  'mov',
  'avi',
  'mp3',
  'wav',
  'flac',
  'aac',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'pdf',
  'json',
  'md',
  'txt',
  'csv',
  'xml',
  'yml',
  'yaml',
  'toml'
]

const ASSET_EXT_PATTERN = ASSET_EXTENSIONS.join('|')

/**
 * Regex patterns to find asset imports in source files.
 * Each pattern captures the asset path in group 1.
 */
const IMPORT_PATTERNS: { type: ImportType; pattern: RegExp }[] = [
  {
    type: 'es-import',
    pattern: new RegExp(
      `import\\s+(?:[\\w\\s{},*]+\\s+from\\s+)?['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]`,
      'gi'
    )
  },
  {
    type: 'dynamic-import',
    pattern: new RegExp(`import\\s*\\(\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]\\s*\\)`, 'gi')
  },
  {
    type: 'require',
    pattern: new RegExp(
      `require\\s*\\(\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]\\s*\\)`,
      'gi'
    )
  },
  {
    type: 'css-url',
    pattern: new RegExp(
      `url\\s*\\(\\s*['"]?([^'")\\s]+\\.(?:${ASSET_EXT_PATTERN}))['"]?\\s*\\)`,
      'gi'
    )
  },
  {
    type: 'html-src',
    pattern: new RegExp(`\\bsrc\\s*=\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]`, 'gi')
  },
  {
    type: 'html-href',
    pattern: new RegExp(`\\bhref\\s*=\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]`, 'gi')
  }
]

export class ImporterScanner extends EventEmitter {
  private root: string
  private options: ResolvedOptions
  /** Maps asset path -> array of importers */
  private cache: Map<string, Importer[]> = new Map()
  /** Reverse index: source file -> set of asset paths it imports */
  private reverseIndex: Map<string, Set<string>> = new Map()
  private watcher?: chokidar.FSWatcher
  private scanPromise?: Promise<void>
  private initialized = false

  constructor(root: string, options: ResolvedOptions) {
    super()
    this.root = root
    this.options = options
  }

  async init(): Promise<void> {
    if (this.initialized) return
    await this.scan()
    if (this.options.watch) {
      this.initWatcher()
    }
    this.initialized = true
  }

  async scan(): Promise<void> {
    if (this.scanPromise) {
      await this.scanPromise
      return
    }

    this.scanPromise = this.performScan()
    await this.scanPromise
    this.scanPromise = undefined
  }

  private async performScan(): Promise<void> {
    const patterns = this.options.include.map(dir => `${dir}/**/*.{${SOURCE_EXTENSIONS.join(',')}}`)

    const entries = await fg(patterns, {
      cwd: this.root,
      ignore: this.options.exclude.map(p => `**/${p}/**`),
      absolute: false,
      onlyFiles: true,
      dot: false
    })

    this.cache.clear()
    this.reverseIndex.clear()

    const BATCH_SIZE = 50
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(filePath => this.scanFile(filePath)))
    }
  }

  private async scanFile(relativePath: string): Promise<void> {
    const absolutePath = path.join(this.root, relativePath)

    try {
      const content = await fs.readFile(absolutePath, 'utf-8')
      const importers = this.findImportsInFile(content, relativePath, absolutePath)

      const previousAssets = this.reverseIndex.get(relativePath)
      if (previousAssets) {
        for (const assetPath of previousAssets) {
          const assetImporters = this.cache.get(assetPath)
          if (assetImporters) {
            const filtered = assetImporters.filter(i => i.filePath !== relativePath)
            if (filtered.length > 0) {
              this.cache.set(assetPath, filtered)
            } else {
              this.cache.delete(assetPath)
            }
          }
        }
      }

      const newAssets = new Set<string>()

      for (const importer of importers) {
        const assetPath = this.resolveAssetPath(importer.filePath, importer.snippet)
        if (assetPath) {
          newAssets.add(assetPath)

          const existing = this.cache.get(assetPath) || []
          existing.push({ ...importer, filePath: relativePath, absolutePath })
          this.cache.set(assetPath, existing)
        }
      }

      this.reverseIndex.set(relativePath, newAssets)
    } catch {
      // File might have been deleted or is unreadable
    }
  }

  private findImportsInFile(
    content: string,
    relativePath: string,
    absolutePath: string
  ): Importer[] {
    const importers: Importer[] = []
    const lines = content.split('\n')
    const fileDir = path.dirname(relativePath)

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]

      for (const { type, pattern } of IMPORT_PATTERNS) {
        pattern.lastIndex = 0

        let match
        while ((match = pattern.exec(line)) !== null) {
          const importPath = match[1]
          const resolvedAssetPath = this.resolveImportPath(importPath, fileDir)

          if (resolvedAssetPath) {
            importers.push({
              filePath: relativePath,
              absolutePath,
              line: lineIndex + 1,
              column: match.index + 1,
              importType: type,
              snippet: line.trim().slice(0, 100)
            })
          }
        }
      }
    }

    return importers
  }

  /**
   * Resolves an import path relative to the file directory.
   * Returns the normalized asset path relative to project root, or null if invalid.
   */
  private resolveImportPath(importPath: string, fileDir: string): string | null {
    if (
      importPath.startsWith('http://') ||
      importPath.startsWith('https://') ||
      importPath.startsWith('//')
    ) {
      return null
    }

    if (
      !importPath.startsWith('.') &&
      !importPath.startsWith('/') &&
      !importPath.startsWith('@/')
    ) {
      return null
    }

    let resolvedPath: string

    if (importPath.startsWith('/')) {
      resolvedPath = importPath.slice(1)
      if (!resolvedPath.startsWith('public/')) {
        resolvedPath = 'public' + importPath
      }
    } else if (importPath.startsWith('@/')) {
      resolvedPath = 'src/' + importPath.slice(2)
    } else {
      resolvedPath = path.normalize(path.join(fileDir, importPath))
    }

    resolvedPath = resolvedPath.split(path.sep).join('/')

    return resolvedPath
  }

  /**
   * Extract asset path from importer snippet (for reverse lookup)
   */
  private resolveAssetPath(sourceFile: string, snippet: string): string | null {
    const fileDir = path.dirname(sourceFile)

    for (const { pattern } of IMPORT_PATTERNS) {
      pattern.lastIndex = 0
      const match = pattern.exec(snippet)
      if (match) {
        return this.resolveImportPath(match[1], fileDir)
      }
    }

    return null
  }

  /**
   * Get all importers for a specific asset.
   * @param assetPath - Relative path to the asset from project root
   */
  getImporters(assetPath: string): Importer[] {
    const normalizedPath = assetPath.split(path.sep).join('/')

    let importers = this.cache.get(normalizedPath)

    if (!importers) {
      if (normalizedPath.startsWith('public/')) {
        importers = this.cache.get(normalizedPath.slice(7))
      } else {
        importers = this.cache.get('public/' + normalizedPath)
      }
    }

    return importers || []
  }

  /**
   * Get assets affected when a source file changes.
   */
  private getAffectedAssets(sourceFile: string): string[] {
    return Array.from(this.reverseIndex.get(sourceFile) || [])
  }

  private initWatcher(): void {
    const watchPaths = this.options.include.map(dir => path.join(this.root, dir))

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        ...this.options.exclude.map(p => `**/${p}/**`),
        (filePath: string) => {
          const ext = path.extname(filePath).slice(1)
          return ext !== '' && !SOURCE_EXTENSIONS.includes(ext)
        }
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50
      }
    })

    this.watcher.on('add', filePath => this.handleFileChange('add', filePath))
    this.watcher.on('unlink', filePath => this.handleFileChange('unlink', filePath))
    this.watcher.on('change', filePath => this.handleFileChange('change', filePath))
  }

  private async handleFileChange(event: string, absolutePath: string): Promise<void> {
    const relativePath = path.relative(this.root, absolutePath)
    const extension = path.extname(relativePath).slice(1)

    if (!SOURCE_EXTENSIONS.includes(extension)) {
      return
    }

    const previousAssets = this.getAffectedAssets(relativePath)

    if (event === 'unlink') {
      for (const assetPath of previousAssets) {
        const assetImporters = this.cache.get(assetPath)
        if (assetImporters) {
          const filtered = assetImporters.filter(i => i.filePath !== relativePath)
          if (filtered.length > 0) {
            this.cache.set(assetPath, filtered)
          } else {
            this.cache.delete(assetPath)
          }
        }
      }
      this.reverseIndex.delete(relativePath)
    } else {
      await this.scanFile(relativePath)
    }

    const currentAssets = this.getAffectedAssets(relativePath)
    const allAffectedAssets = [...new Set([...previousAssets, ...currentAssets])]

    if (allAffectedAssets.length > 0) {
      this.emit('change', {
        event,
        path: relativePath,
        affectedAssets: allAffectedAssets
      })
    }
  }

  destroy(): void {
    this.watcher?.close()
  }
}
