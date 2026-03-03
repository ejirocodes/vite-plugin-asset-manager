import { EventEmitter } from 'events'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import chokidar, { type FSWatcher } from 'chokidar'
import type { Asset, ExtensionSettings } from '../types.js'

const STREAMING_THRESHOLD = 1024 * 1024

export interface DuplicateInfo {
  hash: string
  duplicatesCount: number
}

export class DuplicateScanner extends EventEmitter {
  private root: string
  private settings: ExtensionSettings
  private hashCache = new Map<string, { hash: string; mtime: number; size: number }>()
  private duplicateGroups = new Map<string, Set<string>>()
  private pathToHash = new Map<string, string>()
  private watcher?: FSWatcher
  private initialized = false

  constructor(root: string, settings: ExtensionSettings) {
    super()
    this.root = root
    this.settings = settings
  }

  async init(assets: Asset[]): Promise<void> {
    if (this.initialized) return
    await this.scanAssets(assets)
    this.initWatcher(assets)
    this.initialized = true
  }

  private async scanAssets(assets: Asset[]): Promise<void> {
    this.duplicateGroups.clear()
    this.pathToHash.clear()

    const BATCH_SIZE = 20
    for (let i = 0; i < assets.length; i += BATCH_SIZE) {
      const batch = assets.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(a => this.processAsset(a)))
    }
  }

  private async processAsset(asset: Asset): Promise<void> {
    try {
      const hash = await this.getOrComputeHash(asset.path, asset.absolutePath)
      if (hash) {
        this.pathToHash.set(asset.path, hash)
        if (!this.duplicateGroups.has(hash)) this.duplicateGroups.set(hash, new Set())
        this.duplicateGroups.get(hash)!.add(asset.path)
      }
    } catch {
      // Ignore individual asset failures
    }
  }

  private async getOrComputeHash(relativePath: string, absolutePath: string): Promise<string | null> {
    try {
      const stats = await fs.promises.stat(absolutePath)
      const cached = this.hashCache.get(relativePath)
      if (cached && cached.mtime === stats.mtimeMs && cached.size === stats.size) {
        return cached.hash
      }
      const hash = await this.computeFileHash(absolutePath, stats.size)
      this.hashCache.set(relativePath, { hash, mtime: stats.mtimeMs, size: stats.size })
      return hash
    } catch {
      return null
    }
  }

  private async computeFileHash(absolutePath: string, size: number): Promise<string> {
    if (size > STREAMING_THRESHOLD) {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5')
        const stream = fs.createReadStream(absolutePath)
        stream.on('data', (chunk: Buffer) => hash.update(chunk))
        stream.on('end', () => resolve(hash.digest('hex')))
        stream.on('error', reject)
      })
    }
    const content = await fs.promises.readFile(absolutePath)
    return crypto.createHash('md5').update(content).digest('hex')
  }

  getDuplicateInfo(assetPath: string): DuplicateInfo {
    const normalized = assetPath.split(path.sep).join('/')
    const hash = this.pathToHash.get(normalized)
    if (!hash) return { hash: '', duplicatesCount: 0 }
    const group = this.duplicateGroups.get(hash)
    return { hash, duplicatesCount: group ? group.size - 1 : 0 }
  }

  getStats(): { duplicateGroups: number; duplicateFiles: number } {
    let duplicateGroups = 0
    let duplicateFiles = 0
    for (const [, paths] of this.duplicateGroups) {
      if (paths.size > 1) {
        duplicateGroups++
        duplicateFiles += paths.size
      }
    }
    return { duplicateGroups, duplicateFiles }
  }

  private async handleAssetChange(
    event: 'add' | 'change' | 'unlink',
    relativePath: string,
    absolutePath: string
  ): Promise<void> {
    const normalized = relativePath.split(path.sep).join('/')
    const previousHash = this.pathToHash.get(normalized)
    const affectedHashes: string[] = []

    if (previousHash) {
      affectedHashes.push(previousHash)
      const oldGroup = this.duplicateGroups.get(previousHash)
      if (oldGroup) {
        oldGroup.delete(normalized)
        if (oldGroup.size === 0) this.duplicateGroups.delete(previousHash)
      }
      this.pathToHash.delete(normalized)
    }

    if (event === 'unlink') {
      this.hashCache.delete(normalized)
    } else {
      try {
        const stats = await fs.promises.stat(absolutePath)
        const hash = await this.computeFileHash(absolutePath, stats.size)
        this.hashCache.set(normalized, { hash, mtime: stats.mtimeMs, size: stats.size })
        this.pathToHash.set(normalized, hash)
        if (!this.duplicateGroups.has(hash)) this.duplicateGroups.set(hash, new Set())
        this.duplicateGroups.get(hash)!.add(normalized)
        if (!affectedHashes.includes(hash)) affectedHashes.push(hash)
      } catch {
        // Ignore
      }
    }

    if (affectedHashes.length > 0) {
      this.emit('change', { event, affectedHashes })
    }
  }

  private initWatcher(assets: Asset[]): void {
    const watchPaths = this.settings.include.length > 0
      ? this.settings.include.map(d => path.join(this.root, d))
      : [this.root]

    const assetExtensions = new Set(assets.map(a => a.extension.toLowerCase()))

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        ...this.settings.exclude.map(p => `**/${p}/**`),
        (fp: string) => {
          const ext = path.extname(fp).toLowerCase()
          return ext !== '' && !assetExtensions.has(ext)
        }
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
    })

    this.watcher.on('add', async (fp: string) => {
      const rel = path.relative(this.root, fp)
      await this.handleAssetChange('add', rel, fp)
    })
    this.watcher.on('change', async (fp: string) => {
      const rel = path.relative(this.root, fp)
      await this.handleAssetChange('change', rel, fp)
    })
    this.watcher.on('unlink', async (fp: string) => {
      const rel = path.relative(this.root, fp)
      await this.handleAssetChange('unlink', rel, fp)
    })
  }

  destroy(): void {
    this.watcher?.close()
    this.hashCache.clear()
    this.duplicateGroups.clear()
    this.pathToHash.clear()
  }
}
