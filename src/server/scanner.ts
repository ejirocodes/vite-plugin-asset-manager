import { EventEmitter } from 'events'
import fg from 'fast-glob'
import path from 'path'
import fs from 'fs/promises'
import chokidar from 'chokidar'
import type { Asset, AssetGroup, AssetType, ResolvedOptions } from '../shared/types.js'

export interface ScannerEvents {
  change: [{ event: string; path: string }]
}

export class AssetScanner extends EventEmitter {
  private root: string
  private options: ResolvedOptions
  private cache: Map<string, Asset> = new Map()
  private watcher?: chokidar.FSWatcher
  private scanPromise?: Promise<void>

  constructor(root: string, options: ResolvedOptions) {
    super()
    this.root = root
    this.options = options
  }

  async init(): Promise<void> {
    await this.scan()
    if (this.options.watch) {
      this.initWatcher()
    }
  }

  async scan(): Promise<Asset[]> {
    if (this.scanPromise) {
      await this.scanPromise
      return this.getAssets()
    }

    this.scanPromise = this.performScan()
    await this.scanPromise
    this.scanPromise = undefined

    return this.getAssets()
  }

  private async performScan(): Promise<void> {
    const extensionPattern = this.options.extensions.map(ext => ext.replace('.', '')).join(',')

    const patterns = this.options.include.map(dir => `${dir}/**/*.{${extensionPattern}}`)

    const entries = await fg(patterns, {
      cwd: this.root,
      ignore: this.options.exclude.map(p => `**/${p}/**`),
      absolute: false,
      stats: true,
      onlyFiles: true,
      dot: false
    })

    this.cache.clear()

    for (const entry of entries) {
      const asset = this.createAsset(entry)
      this.cache.set(asset.path, asset)
    }
  }

  private createAsset(entry: fg.Entry): Asset {
    const relativePath = entry.path
    const absolutePath = path.join(this.root, relativePath)
    const extension = path.extname(relativePath).toLowerCase()
    const name = path.basename(relativePath)
    const directory = path.dirname(relativePath)

    return {
      id: Buffer.from(relativePath).toString('base64url'),
      name,
      path: relativePath,
      absolutePath,
      extension,
      type: this.getAssetType(extension),
      size: entry.stats?.size || 0,
      mtime: entry.stats?.mtimeMs || Date.now(),
      directory: directory === '.' ? '/' : directory
    }
  }

  private getAssetType(extension: string): AssetType {
    const imageExts = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.webp',
      '.avif',
      '.ico',
      '.bmp',
      '.tiff',
      '.tif',
      '.heic',
      '.heif'
    ]
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    const audioExts = ['.mp3', '.wav', '.flac', '.aac']
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
    const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot']
    const dataExts = ['.json', '.csv', '.xml', '.yml', '.yaml', '.toml']
    const textExts = ['.md', '.txt']

    if (imageExts.includes(extension)) return 'image'
    if (videoExts.includes(extension)) return 'video'
    if (audioExts.includes(extension)) return 'audio'
    if (docExts.includes(extension)) return 'document'
    if (fontExts.includes(extension)) return 'font'
    if (dataExts.includes(extension)) return 'data'
    if (textExts.includes(extension)) return 'text'
    return 'other'
  }

  getAssets(): Asset[] {
    return Array.from(this.cache.values())
  }

  getGroupedAssets(): AssetGroup[] {
    const groups = new Map<string, Asset[]>()

    for (const asset of this.cache.values()) {
      const dir = asset.directory
      if (!groups.has(dir)) {
        groups.set(dir, [])
      }
      groups.get(dir)!.push(asset)
    }

    return Array.from(groups.entries())
      .map(([directory, assets]) => ({
        directory,
        assets: assets.sort((a, b) => a.name.localeCompare(b.name)),
        count: assets.length
      }))
      .sort((a, b) => a.directory.localeCompare(b.directory))
  }

  search(query: string): Asset[] {
    const normalizedQuery = query.toLowerCase().trim()
    if (!normalizedQuery) return this.getAssets()

    return this.getAssets().filter(
      asset =>
        asset.name.toLowerCase().includes(normalizedQuery) ||
        asset.path.toLowerCase().includes(normalizedQuery)
    )
  }

  getAsset(relativePath: string): Asset | undefined {
    return this.cache.get(relativePath)
  }

  /**
   * Enrich assets with importer count metadata.
   * Should be called after scanning completes and when importers change.
   */
  enrichWithImporterCounts(importerScanner: { getImporters: (assetPath: string) => any[] }): void {
    for (const asset of this.cache.values()) {
      const importers = importerScanner.getImporters(asset.path)
      asset.importersCount = importers.length
    }
  }

  /**
   * Enrich assets with duplicate detection metadata.
   * Should be called after scanning completes and when file content changes.
   */
  enrichWithDuplicateInfo(duplicateScanner: {
    getDuplicateInfo: (assetPath: string) => { hash: string; duplicatesCount: number }
  }): void {
    for (const asset of this.cache.values()) {
      const info = duplicateScanner.getDuplicateInfo(asset.path)
      asset.contentHash = info.hash
      asset.duplicatesCount = info.duplicatesCount
    }
  }

  private initWatcher(): void {
    const watchPaths = this.options.include.map(dir => path.join(this.root, dir))

    this.watcher = chokidar.watch(watchPaths, {
      ignored: this.options.exclude.map(p => `**/${p}/**`),
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      }
    })

    this.watcher.on('add', filePath => this.handleFileChange('add', filePath))
    this.watcher.on('unlink', filePath => this.handleFileChange('unlink', filePath))
    this.watcher.on('change', filePath => this.handleFileChange('change', filePath))
  }

  private async handleFileChange(event: string, absolutePath: string): Promise<void> {
    const relativePath = path.relative(this.root, absolutePath)
    const extension = path.extname(relativePath).toLowerCase()

    if (!this.options.extensions.includes(extension)) {
      return
    }

    if (event === 'unlink') {
      this.cache.delete(relativePath)
    } else {
      try {
        const stats = await fs.stat(absolutePath)
        const asset: Asset = {
          id: Buffer.from(relativePath).toString('base64url'),
          name: path.basename(relativePath),
          path: relativePath,
          absolutePath,
          extension,
          type: this.getAssetType(extension),
          size: stats.size,
          mtime: stats.mtimeMs,
          directory: path.dirname(relativePath)
        }
        this.cache.set(relativePath, asset)
      } catch {
        return
      }
    }

    this.emit('change', { event, path: relativePath })
  }

  destroy(): void {
    this.watcher?.close()
  }
}
