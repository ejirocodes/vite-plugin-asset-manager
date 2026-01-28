import { EventEmitter } from 'events'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import chokidar from 'chokidar'
import type { ResolvedOptions, Asset } from '../shared/types.js'

export interface DuplicateScannerEvents {
  change: [{ event: string; affectedHashes: string[] }]
}

export interface DuplicateInfo {
  hash: string
  duplicatesCount: number
}

/** Threshold for streaming hash computation (1MB) */
const STREAMING_THRESHOLD = 1024 * 1024

export class DuplicateScanner extends EventEmitter {
  private root: string
  private options: ResolvedOptions
  /** Maps relative path -> { hash, mtime, size } for cache validation */
  private hashCache: Map<string, { hash: string; mtime: number; size: number }> = new Map()
  /** Maps hash -> set of relative paths (for grouping duplicates) */
  private duplicateGroups: Map<string, Set<string>> = new Map()
  /** Reverse index: path -> hash (for quick lookups) */
  private pathToHash: Map<string, string> = new Map()
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
    this.initialized = true
  }

  /**
   * Scan all assets and compute hashes.
   * Called after AssetScanner has discovered assets.
   */
  async scanAssets(assets: Asset[]): Promise<void> {
    if (this.scanPromise) {
      await this.scanPromise
      return
    }

    this.scanPromise = this.performScan(assets)
    await this.scanPromise
    this.scanPromise = undefined
  }

  private async performScan(assets: Asset[]): Promise<void> {
    // Clear duplicate groups but keep hash cache for validation
    this.duplicateGroups.clear()
    this.pathToHash.clear()

    // Process assets in batches to avoid overwhelming I/O
    const BATCH_SIZE = 20
    for (let i = 0; i < assets.length; i += BATCH_SIZE) {
      const batch = assets.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(asset => this.processAsset(asset)))
    }
  }

  private async processAsset(asset: Asset): Promise<void> {
    try {
      const hash = await this.getOrComputeHash(asset.path, asset.absolutePath)
      if (hash) {
        this.pathToHash.set(asset.path, hash)

        // Add to duplicate group
        if (!this.duplicateGroups.has(hash)) {
          this.duplicateGroups.set(hash, new Set())
        }
        this.duplicateGroups.get(hash)!.add(asset.path)
      }
    } catch {
      // File might have been deleted or is unreadable
    }
  }

  /**
   * Get cached hash or compute new one if cache is invalid.
   */
  private async getOrComputeHash(
    relativePath: string,
    absolutePath: string
  ): Promise<string | null> {
    try {
      const stats = await fs.promises.stat(absolutePath)

      // Check if cached hash is still valid
      const cached = this.hashCache.get(relativePath)
      if (cached && cached.mtime === stats.mtimeMs && cached.size === stats.size) {
        return cached.hash
      }

      // Compute new hash
      const hash = await this.computeFileHash(absolutePath, stats.size)

      // Update cache
      this.hashCache.set(relativePath, {
        hash,
        mtime: stats.mtimeMs,
        size: stats.size
      })

      return hash
    } catch {
      return null
    }
  }

  /**
   * Compute MD5 hash of file contents.
   * Uses streaming for large files to avoid memory issues.
   */
  private async computeFileHash(absolutePath: string, size: number): Promise<string> {
    // Use streaming for files > 1MB
    if (size > STREAMING_THRESHOLD) {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5')
        const stream = fs.createReadStream(absolutePath)
        stream.on('data', (chunk: Buffer) => hash.update(chunk))
        stream.on('end', () => resolve(hash.digest('hex')))
        stream.on('error', reject)
      })
    }

    // Read small files directly
    const content = await fs.promises.readFile(absolutePath)
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Get duplicate info for a specific asset.
   */
  getDuplicateInfo(assetPath: string): DuplicateInfo {
    const normalizedPath = assetPath.split(path.sep).join('/')
    const hash = this.pathToHash.get(normalizedPath)

    if (!hash) {
      return { hash: '', duplicatesCount: 0 }
    }

    const group = this.duplicateGroups.get(hash)
    const duplicatesCount = group ? group.size - 1 : 0 // Exclude self

    return { hash, duplicatesCount }
  }

  /**
   * Get all assets in a duplicate group by hash.
   */
  getDuplicatesByHash(hash: string): string[] {
    const group = this.duplicateGroups.get(hash)
    return group ? Array.from(group).sort() : []
  }

  /**
   * Get duplicate statistics.
   */
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

  /**
   * Enrich assets with duplicate detection metadata.
   */
  enrichAssetsWithDuplicateInfo(assets: Asset[]): void {
    for (const asset of assets) {
      const info = this.getDuplicateInfo(asset.path)
      asset.contentHash = info.hash
      asset.duplicatesCount = info.duplicatesCount
    }
  }

  /**
   * Handle file change event from watcher.
   * Recalculates hash and updates duplicate groups.
   */
  async handleAssetChange(
    event: 'add' | 'change' | 'unlink',
    relativePath: string,
    absolutePath: string
  ): Promise<void> {
    const normalizedPath = relativePath.split(path.sep).join('/')
    const previousHash = this.pathToHash.get(normalizedPath)
    const affectedHashes: string[] = []

    if (previousHash) {
      affectedHashes.push(previousHash)
      // Remove from old group
      const oldGroup = this.duplicateGroups.get(previousHash)
      if (oldGroup) {
        oldGroup.delete(normalizedPath)
        if (oldGroup.size === 0) {
          this.duplicateGroups.delete(previousHash)
        }
      }
      this.pathToHash.delete(normalizedPath)
    }

    if (event === 'unlink') {
      // File was deleted, just clean up cache
      this.hashCache.delete(normalizedPath)
    } else {
      // File was added or changed, compute new hash
      try {
        const stats = await fs.promises.stat(absolutePath)
        const hash = await this.computeFileHash(absolutePath, stats.size)

        // Update caches
        this.hashCache.set(normalizedPath, {
          hash,
          mtime: stats.mtimeMs,
          size: stats.size
        })
        this.pathToHash.set(normalizedPath, hash)

        // Add to new group
        if (!this.duplicateGroups.has(hash)) {
          this.duplicateGroups.set(hash, new Set())
        }
        this.duplicateGroups.get(hash)!.add(normalizedPath)

        if (!affectedHashes.includes(hash)) {
          affectedHashes.push(hash)
        }
      } catch {
        // File might have been deleted
      }
    }

    // Emit change event if duplicate status changed
    if (affectedHashes.length > 0) {
      this.emit('change', { event, affectedHashes })
    }
  }

  /**
   * Initialize file watcher for real-time updates.
   * Note: This watches asset files, not source files.
   */
  initWatcher(): void {
    if (this.watcher) return

    const watchPaths = this.options.include.map(dir => path.join(this.root, dir))
    const extensionPattern = this.options.extensions.map(ext => ext.replace('.', '')).join(',')

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        ...this.options.exclude.map(p => `**/${p}/**`),
        (filePath: string) => {
          const ext = path.extname(filePath).toLowerCase()
          return ext !== '' && !this.options.extensions.includes(ext)
        }
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50
      }
    })

    this.watcher.on('add', async filePath => {
      const relativePath = path.relative(this.root, filePath)
      await this.handleAssetChange('add', relativePath, filePath)
    })

    this.watcher.on('change', async filePath => {
      const relativePath = path.relative(this.root, filePath)
      await this.handleAssetChange('change', relativePath, filePath)
    })

    this.watcher.on('unlink', async filePath => {
      const relativePath = path.relative(this.root, filePath)
      await this.handleAssetChange('unlink', relativePath, filePath)
    })
  }

  destroy(): void {
    this.watcher?.close()
    this.hashCache.clear()
    this.duplicateGroups.clear()
    this.pathToHash.clear()
  }
}
