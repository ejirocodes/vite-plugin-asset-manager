import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { createHash } from 'crypto'
import os from 'os'

export class ThumbnailService {
  private size: number
  private cache: Map<string, Buffer> = new Map()
  private cacheDir: string
  private supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']

  constructor(size: number = 200) {
    this.size = size
    this.cacheDir = path.join(os.tmpdir(), 'vite-asset-manager-thumbnails')
  }

  async getThumbnail(absolutePath: string): Promise<Buffer | null> {
    const extension = path.extname(absolutePath).toLowerCase()

    if (!this.supportedFormats.includes(extension)) {
      return null
    }

    const cacheKey = await this.getCacheKey(absolutePath)

    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const diskCached = await this.loadFromDiskCache(cacheKey)
    if (diskCached) {
      this.cache.set(cacheKey, diskCached)
      return diskCached
    }

    try {
      const thumbnail = await this.generateThumbnail(absolutePath)
      this.cache.set(cacheKey, thumbnail)
      await this.saveToDiskCache(cacheKey, thumbnail)
      return thumbnail
    } catch (error) {
      console.warn(`[asset-manager] Failed to generate thumbnail for ${absolutePath}:`, error)
      return null
    }
  }

  private async generateThumbnail(absolutePath: string): Promise<Buffer> {
    return sharp(absolutePath)
      .resize(this.size, this.size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer()
  }

  private async getCacheKey(absolutePath: string): Promise<string> {
    const hash = createHash('md5')
    hash.update(absolutePath)
    hash.update(this.size.toString())

    try {
      const stats = await fs.stat(absolutePath)
      hash.update(stats.mtimeMs.toString())
    } catch {
      // File might not exist
    }

    return hash.digest('hex')
  }

  private async loadFromDiskCache(key: string): Promise<Buffer | null> {
    try {
      const cachePath = path.join(this.cacheDir, `${key}.jpg`)
      return await fs.readFile(cachePath)
    } catch {
      return null
    }
  }

  private async saveToDiskCache(key: string, data: Buffer): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      const cachePath = path.join(this.cacheDir, `${key}.jpg`)
      await fs.writeFile(cachePath, data)
    } catch {
      // Ignore cache write failures
    }
  }

  invalidate(absolutePath: string): void {
    this.getCacheKey(absolutePath).then(key => {
      this.cache.delete(key)
    })
  }

  isSupportedFormat(extension: string): boolean {
    return this.supportedFormats.includes(extension.toLowerCase())
  }
}
