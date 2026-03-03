import { EventEmitter } from 'events'
import fg from 'fast-glob'
import path from 'path'
import fs from 'fs/promises'
import chokidar, { type FSWatcher } from 'chokidar'
import type { Asset, AssetGroup, AssetType, Importer, ExtensionSettings } from '../types.js'

const IMAGE_EXTS = ['.png','.jpg','.jpeg','.gif','.svg','.webp','.avif','.ico','.bmp','.tiff','.tif','.heic','.heif']
const VIDEO_EXTS = ['.mp4','.webm','.ogg','.mov','.avi']
const AUDIO_EXTS = ['.mp3','.wav','.flac','.aac']
const DOC_EXTS = ['.pdf','.doc','.docx','.xls','.xlsx','.ppt','.pptx']
const FONT_EXTS = ['.woff','.woff2','.ttf','.otf','.eot']
const DATA_EXTS = ['.json','.csv','.xml','.yml','.yaml','.toml']
const TEXT_EXTS = ['.md','.txt']

const ALL_EXTENSIONS = [
  ...IMAGE_EXTS, ...VIDEO_EXTS, ...AUDIO_EXTS,
  ...DOC_EXTS, ...FONT_EXTS, ...DATA_EXTS, ...TEXT_EXTS
]

export class AssetScanner extends EventEmitter {
  private root: string
  private settings: ExtensionSettings
  private cache = new Map<string, Asset>()
  private watcher?: FSWatcher

  constructor(root: string, settings: ExtensionSettings) {
    super()
    this.root = root
    this.settings = settings
  }

  async init(): Promise<void> {
    await this.performScan()
    this.initWatcher()
  }

  private async performScan(): Promise<void> {
    const extPattern = ALL_EXTENSIONS.map(e => e.slice(1)).join(',')
    const includePatterns = this.settings.include.length > 0
      ? this.settings.include.map(dir => `${dir}/**/*.{${extPattern}}`)
      : [`**/*.{${extPattern}}`]

    const entries = await fg(includePatterns, {
      cwd: this.root,
      ignore: this.settings.exclude.map(p => `**/${p}/**`),
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
    const relativePath = entry.path.split(path.sep).join('/')
    const ext = path.extname(relativePath).toLowerCase()
    const dir = path.dirname(relativePath)
    return {
      id: Buffer.from(relativePath).toString('base64url'),
      name: path.basename(relativePath),
      path: relativePath,
      absolutePath: path.join(this.root, relativePath),
      extension: ext,
      type: this.getAssetType(ext),
      size: entry.stats?.size ?? 0,
      mtime: entry.stats?.mtimeMs ?? Date.now(),
      directory: dir === '.' ? '/' : dir,
      importersCount: 0,
      contentHash: '',
      duplicatesCount: 0
    }
  }

  private getAssetType(ext: string): AssetType {
    if (IMAGE_EXTS.includes(ext)) return 'image'
    if (VIDEO_EXTS.includes(ext)) return 'video'
    if (AUDIO_EXTS.includes(ext)) return 'audio'
    if (DOC_EXTS.includes(ext)) return 'document'
    if (FONT_EXTS.includes(ext)) return 'font'
    if (DATA_EXTS.includes(ext)) return 'data'
    if (TEXT_EXTS.includes(ext)) return 'text'
    return 'other'
  }

  getAssets(): Asset[] {
    return Array.from(this.cache.values())
  }

  getGroupedAssets(): AssetGroup[] {
    const groups = new Map<string, Asset[]>()
    for (const asset of this.cache.values()) {
      if (!groups.has(asset.directory)) groups.set(asset.directory, [])
      groups.get(asset.directory)!.push(asset)
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
    const q = query.toLowerCase().trim()
    if (!q) return this.getAssets()
    return this.getAssets().filter(
      a => a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q)
    )
  }

  enrichWithImporterCounts(getImporters: (p: string) => Importer[]): void {
    for (const asset of this.cache.values()) {
      asset.importersCount = getImporters(asset.path).length
    }
  }

  enrichWithDuplicateInfo(getDuplicateInfo: (p: string) => { hash: string; duplicatesCount: number }): void {
    for (const asset of this.cache.values()) {
      const info = getDuplicateInfo(asset.path)
      asset.contentHash = info.hash
      asset.duplicatesCount = info.duplicatesCount
    }
  }

  private initWatcher(): void {
    const watchPaths = this.settings.include.length > 0
      ? this.settings.include.map(d => path.join(this.root, d))
      : [this.root]

    this.watcher = chokidar.watch(watchPaths, {
      ignored: this.settings.exclude.map(p => `**/${p}/**`),
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
    })

    this.watcher.on('add', (fp: string) => this.handleChange('add', fp))
    this.watcher.on('change', (fp: string) => this.handleChange('change', fp))
    this.watcher.on('unlink', (fp: string) => this.handleChange('unlink', fp))
  }

  private async handleChange(event: string, absolutePath: string): Promise<void> {
    const relativePath = path.relative(this.root, absolutePath).split(path.sep).join('/')
    const ext = path.extname(relativePath).toLowerCase()
    if (!ALL_EXTENSIONS.includes(ext)) return

    if (event === 'unlink') {
      this.cache.delete(relativePath)
    } else {
      try {
        const stats = await fs.stat(absolutePath)
        const dir = path.dirname(relativePath)
        const asset: Asset = {
          id: Buffer.from(relativePath).toString('base64url'),
          name: path.basename(relativePath),
          path: relativePath,
          absolutePath,
          extension: ext,
          type: this.getAssetType(ext),
          size: stats.size,
          mtime: stats.mtimeMs,
          directory: dir === '.' ? '/' : dir,
          importersCount: 0,
          contentHash: '',
          duplicatesCount: 0
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
