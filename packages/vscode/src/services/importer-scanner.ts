import { EventEmitter } from 'events'
import fg from 'fast-glob'
import path from 'path'
import fs from 'fs/promises'
import chokidar, { type FSWatcher } from 'chokidar'
import type { Importer, ImportType, ExtensionSettings } from '../types.js'

const SOURCE_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'vue', 'svelte', 'css', 'scss', 'less', 'html']

const ASSET_EXTENSIONS = [
  'png','jpg','jpeg','gif','svg','webp','avif','ico','bmp','tiff','tif','heic','heif',
  'mp4','webm','ogg','mov','avi','mp3','wav','flac','aac',
  'woff','woff2','ttf','otf','eot',
  'pdf','json','md','txt','csv','xml','yml','yaml','toml'
]

const ASSET_EXT_PATTERN = ASSET_EXTENSIONS.join('|')

function stripComments(content: string, isHtml: boolean): string {
  let result = content
  result = result.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length))
  if (isHtml) {
    result = result.replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length))
  }
  return result
}

const IMPORT_PATTERNS: { type: ImportType; pattern: RegExp }[] = [
  {
    type: 'es-import',
    pattern: new RegExp(`import\\s+(?:[\\w\\s{},*]+\\s+from\\s+)?['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]`, 'gi')
  },
  {
    type: 'dynamic-import',
    pattern: new RegExp(`import\\s*\\(\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]\\s*\\)`, 'gi')
  },
  {
    type: 'require',
    pattern: new RegExp(`require\\s*\\(\\s*['"]([^'"]*\\.(?:${ASSET_EXT_PATTERN}))['"]\\s*\\)`, 'gi')
  },
  {
    type: 'css-url',
    pattern: new RegExp(`url\\s*\\(\\s*['"]?([^'")\\s]+\\.(?:${ASSET_EXT_PATTERN}))['"]?\\s*\\)`, 'gi')
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
  private settings: ExtensionSettings
  private cache = new Map<string, Importer[]>()
  private reverseIndex = new Map<string, Set<string>>()
  private watcher?: FSWatcher
  private initialized = false

  constructor(root: string, settings: ExtensionSettings) {
    super()
    this.root = root
    this.settings = settings
  }

  async init(): Promise<void> {
    if (this.initialized) return
    await this.performScan()
    this.initWatcher()
    this.initialized = true
  }

  private async performScan(): Promise<void> {
    const patterns = this.settings.include.length > 0
      ? this.settings.include.map(dir => `${dir}/**/*.{${SOURCE_EXTENSIONS.join(',')}}`)
      : [`**/*.{${SOURCE_EXTENSIONS.join(',')}}`]

    const entries = await fg(patterns, {
      cwd: this.root,
      ignore: this.settings.exclude.map(p => `**/${p}/**`),
      absolute: false,
      onlyFiles: true,
      dot: false
    })

    this.cache.clear()
    this.reverseIndex.clear()

    const BATCH_SIZE = 50
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(fp => this.scanFile(fp)))
    }

    try {
      await fs.access(path.join(this.root, 'index.html'))
      await this.scanFile('index.html')
    } catch {
      // No root index.html
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
          const existing = this.cache.get(assetPath)
          if (existing) {
            const filtered = existing.filter(i => i.filePath !== relativePath)
            if (filtered.length > 0) this.cache.set(assetPath, filtered)
            else this.cache.delete(assetPath)
          }
        }
      }

      const newAssets = new Set<string>()
      for (const importer of importers) {
        const assetPath = this.resolveAssetPath(importer.filePath, importer.snippet)
        if (assetPath) {
          newAssets.add(assetPath)
          const existing = this.cache.get(assetPath) ?? []
          existing.push({ ...importer, filePath: relativePath, absolutePath })
          this.cache.set(assetPath, existing)
        }
      }
      this.reverseIndex.set(relativePath, newAssets)
    } catch {
      // Ignore unreadable files
    }
  }

  private findImportsInFile(content: string, relativePath: string, absolutePath: string): Importer[] {
    const importers: Importer[] = []
    const ext = path.extname(relativePath).slice(1).toLowerCase()
    const isHtml = ext === 'html'
    const stripped = stripComments(content, isHtml)
    const lines = stripped.split('\n')
    const originalLines = content.split('\n')
    const fileDir = path.dirname(relativePath)

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      for (const { type, pattern } of IMPORT_PATTERNS) {
        pattern.lastIndex = 0
        let match
        while ((match = pattern.exec(line)) !== null) {
          if (!isHtml) {
            const commentIdx = line.indexOf('//')
            if (commentIdx !== -1 && match.index >= commentIdx) continue
          }
          const resolved = this.resolveImportPath(match[1], fileDir)
          if (resolved) {
            importers.push({
              filePath: relativePath,
              absolutePath,
              line: li + 1,
              column: match.index + 1,
              importType: type,
              snippet: originalLines[li].trim().slice(0, 100)
            })
          }
        }
      }
    }
    return importers
  }

  private resolveImportPath(importPath: string, fileDir: string): string | null {
    if (
      importPath.startsWith('http://') ||
      importPath.startsWith('https://') ||
      importPath.startsWith('//')
    ) return null

    const aliases = this.settings.aliases ?? { '@/': 'src/' }
    const matchedAlias = Object.keys(aliases).find(a => importPath.startsWith(a))

    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !matchedAlias) {
      return null
    }

    let resolved: string
    if (importPath.startsWith('/')) {
      resolved = importPath.slice(1)
      if (!resolved.startsWith('public/')) resolved = 'public' + importPath
    } else if (matchedAlias) {
      resolved = aliases[matchedAlias] + importPath.slice(matchedAlias.length)
    } else {
      resolved = path.normalize(path.join(fileDir, importPath))
    }

    return resolved.split(path.sep).join('/')
  }

  private resolveAssetPath(sourceFile: string, snippet: string): string | null {
    const fileDir = path.dirname(sourceFile)
    for (const { pattern } of IMPORT_PATTERNS) {
      pattern.lastIndex = 0
      const match = pattern.exec(snippet)
      if (match) return this.resolveImportPath(match[1], fileDir)
    }
    return null
  }

  getImporters(assetPath: string): Importer[] {
    const normalized = assetPath.split(path.sep).join('/')
    let importers = this.cache.get(normalized)
    if (!importers) {
      if (normalized.startsWith('public/')) {
        importers = this.cache.get(normalized.slice(7))
      } else {
        importers = this.cache.get('public/' + normalized)
      }
    }
    return importers ?? []
  }

  private getAffectedAssets(sourceFile: string): string[] {
    return Array.from(this.reverseIndex.get(sourceFile) ?? [])
  }

  private initWatcher(): void {
    const watchPaths = this.settings.include.length > 0
      ? this.settings.include.map(d => path.join(this.root, d))
      : [this.root]

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        ...this.settings.exclude.map(p => `**/${p}/**`),
        (fp: string) => {
          const ext = path.extname(fp).slice(1)
          return ext !== '' && !SOURCE_EXTENSIONS.includes(ext)
        }
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
    })

    this.watcher.on('add', (fp: string) => this.handleFileChange('add', fp))
    this.watcher.on('unlink', (fp: string) => this.handleFileChange('unlink', fp))
    this.watcher.on('change', (fp: string) => this.handleFileChange('change', fp))
  }

  private async handleFileChange(event: string, absolutePath: string): Promise<void> {
    const relativePath = path.relative(this.root, absolutePath).split(path.sep).join('/')
    const ext = path.extname(relativePath).slice(1)
    if (!SOURCE_EXTENSIONS.includes(ext)) return

    const previousAssets = this.getAffectedAssets(relativePath)

    if (event === 'unlink') {
      for (const assetPath of previousAssets) {
        const existing = this.cache.get(assetPath)
        if (existing) {
          const filtered = existing.filter(i => i.filePath !== relativePath)
          if (filtered.length > 0) this.cache.set(assetPath, filtered)
          else this.cache.delete(assetPath)
        }
      }
      this.reverseIndex.delete(relativePath)
    } else {
      await this.scanFile(relativePath)
    }

    const currentAssets = this.getAffectedAssets(relativePath)
    const all = [...new Set([...previousAssets, ...currentAssets])]
    if (all.length > 0) {
      this.emit('change', { event, path: relativePath, affectedAssets: all })
    }
  }

  destroy(): void {
    this.watcher?.close()
  }
}
