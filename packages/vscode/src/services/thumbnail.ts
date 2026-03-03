import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import * as vscode from 'vscode'
import sharp from 'sharp'

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff'])

export class ThumbnailService {
  private cacheDir: string
  private size: number
  private memCache = new Map<string, string>()
  readonly storageUri: vscode.Uri

  constructor(globalStorageUri: vscode.Uri, size = 200) {
    this.storageUri = globalStorageUri
    this.cacheDir = path.join(globalStorageUri.fsPath, 'thumbnails')
    this.size = size
  }

  async init(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true })
  }

  async getThumbnailPath(absolutePath: string, mtime: number, fileSize: number): Promise<string | undefined> {
    const ext = path.extname(absolutePath).toLowerCase()

    if (ext === '.svg') return absolutePath
    if (!SUPPORTED.has(ext)) return undefined

    const cacheKey = crypto.createHash('md5')
      .update(absolutePath + this.size.toString() + mtime.toString() + fileSize.toString())
      .digest('hex')

    const cached = this.memCache.get(cacheKey)
    if (cached) return cached

    const thumbPath = path.join(this.cacheDir, `${cacheKey}.jpg`)
    try {
      await fs.access(thumbPath)
      this.memCache.set(cacheKey, thumbPath)
      return thumbPath
    } catch {
      // Not cached — generate below
    }

    try {
      const buffer = await sharp(absolutePath)
        .resize(this.size, this.size, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 })
        .toBuffer()
      await fs.writeFile(thumbPath, buffer)
      this.memCache.set(cacheKey, thumbPath)
      return thumbPath
    } catch {
      return undefined
    }
  }
}
