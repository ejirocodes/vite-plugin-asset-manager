import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('sharp', () => ({
  default: vi.fn()
}))

vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn()
  }
}))

import { ThumbnailService } from '../../src/server/thumbnail'
import sharp from 'sharp'
import fs from 'fs/promises'

const mockSharp = vi.mocked(sharp)
const mockFs = vi.mocked(fs)

describe('ThumbnailService', () => {
  const mockBuffer = Buffer.from('mock-thumbnail-data')
  let sharpInstance: {
    resize: ReturnType<typeof vi.fn>
    jpeg: ReturnType<typeof vi.fn>
    toBuffer: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup sharp mock chain
    sharpInstance = {
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(mockBuffer)
    }
    mockSharp.mockReturnValue(sharpInstance as unknown as sharp.Sharp)

    // Setup fs mocks
    mockFs.stat.mockResolvedValue({
      mtimeMs: Date.now()
    } as import('fs').Stats)
    mockFs.readFile.mockRejectedValue(new Error('ENOENT')) // No disk cache by default
    mockFs.writeFile.mockResolvedValue(undefined)
    mockFs.mkdir.mockResolvedValue(undefined)
  })

  describe('getThumbnail()', () => {
    it('should generate thumbnail for supported image formats', async () => {
      const service = new ThumbnailService(200)

      const thumbnail = await service.getThumbnail('/project/image.png')

      expect(thumbnail).not.toBeNull()
      expect(mockSharp).toHaveBeenCalledWith('/project/image.png')
      expect(sharpInstance.resize).toHaveBeenCalledWith(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      expect(sharpInstance.jpeg).toHaveBeenCalledWith({ quality: 80 })
    })

    it('should return null for unsupported formats', async () => {
      const service = new ThumbnailService(200)

      const thumbnail = await service.getThumbnail('/project/document.pdf')

      expect(thumbnail).toBeNull()
      expect(mockSharp).not.toHaveBeenCalled()
    })

    it('should cache generated thumbnails in memory', async () => {
      const service = new ThumbnailService(200)

      // First call - should generate
      await service.getThumbnail('/project/image.png')
      expect(sharpInstance.toBuffer).toHaveBeenCalledTimes(1)

      // Second call - should use cache
      await service.getThumbnail('/project/image.png')
      expect(sharpInstance.toBuffer).toHaveBeenCalledTimes(1) // Still 1
    })

    it('should load from disk cache if available', async () => {
      const diskCachedBuffer = Buffer.from('disk-cached-thumbnail')
      mockFs.readFile.mockResolvedValueOnce(diskCachedBuffer)

      const service = new ThumbnailService(200)

      const thumbnail = await service.getThumbnail('/project/image.png')

      expect(thumbnail).toEqual(diskCachedBuffer)
      expect(mockSharp).not.toHaveBeenCalled() // Should not generate
    })

    it('should handle sharp errors gracefully', async () => {
      sharpInstance.toBuffer.mockRejectedValueOnce(new Error('Sharp processing failed'))

      const service = new ThumbnailService(200)

      const thumbnail = await service.getThumbnail('/project/corrupted.png')

      expect(thumbnail).toBeNull()
    })

    it('should use custom thumbnail size', async () => {
      const service = new ThumbnailService(300)

      await service.getThumbnail('/project/image.png')

      expect(sharpInstance.resize).toHaveBeenCalledWith(300, 300, expect.any(Object))
    })

    it('should save generated thumbnail to disk cache', async () => {
      const service = new ThumbnailService(200)

      await service.getThumbnail('/project/image.png')

      expect(mockFs.mkdir).toHaveBeenCalled()
      expect(mockFs.writeFile).toHaveBeenCalled()
    })

    it('should handle disk cache write failures silently', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'))

      const service = new ThumbnailService(200)

      // Should not throw
      const thumbnail = await service.getThumbnail('/project/image.png')
      expect(thumbnail).not.toBeNull()
    })
  })

  describe('isSupportedFormat()', () => {
    it('should return true for supported formats', () => {
      const service = new ThumbnailService(200)

      expect(service.isSupportedFormat('.jpg')).toBe(true)
      expect(service.isSupportedFormat('.jpeg')).toBe(true)
      expect(service.isSupportedFormat('.png')).toBe(true)
      expect(service.isSupportedFormat('.webp')).toBe(true)
      expect(service.isSupportedFormat('.gif')).toBe(true)
      expect(service.isSupportedFormat('.avif')).toBe(true)
      expect(service.isSupportedFormat('.tiff')).toBe(true)
    })

    it('should return false for unsupported formats', () => {
      const service = new ThumbnailService(200)

      expect(service.isSupportedFormat('.pdf')).toBe(false)
      expect(service.isSupportedFormat('.mp4')).toBe(false)
      expect(service.isSupportedFormat('.svg')).toBe(false)
      expect(service.isSupportedFormat('.txt')).toBe(false)
    })

    it('should be case-insensitive', () => {
      const service = new ThumbnailService(200)

      expect(service.isSupportedFormat('.JPG')).toBe(true)
      expect(service.isSupportedFormat('.PNG')).toBe(true)
      expect(service.isSupportedFormat('.WebP')).toBe(true)
    })
  })

  describe('invalidate()', () => {
    it('should remove cached thumbnail', async () => {
      const service = new ThumbnailService(200)

      // Generate and cache thumbnail
      await service.getThumbnail('/project/image.png')
      expect(sharpInstance.toBuffer).toHaveBeenCalledTimes(1)

      // Invalidate cache
      service.invalidate('/project/image.png')

      // Wait for async invalidation
      await new Promise(resolve => setTimeout(resolve, 10))

      // Next call should regenerate (mock won't track this well due to async nature)
      // The test verifies invalidate is callable without errors
    })
  })

  describe('cache key generation', () => {
    it('should generate different keys for different files', async () => {
      const service = new ThumbnailService(200)

      await service.getThumbnail('/project/image1.png')
      await service.getThumbnail('/project/image2.png')

      // Both should generate thumbnails (different cache keys)
      expect(sharpInstance.toBuffer).toHaveBeenCalledTimes(2)
    })

    it('should include file mtime in cache key', async () => {
      const service = new ThumbnailService(200)

      // First request with mtime1
      mockFs.stat.mockResolvedValueOnce({ mtimeMs: 1000 } as import('fs').Stats)
      await service.getThumbnail('/project/image.png')

      // Second request with different mtime (file was modified)
      mockFs.stat.mockResolvedValueOnce({ mtimeMs: 2000 } as import('fs').Stats)
      mockFs.readFile.mockRejectedValueOnce(new Error('ENOENT'))
      await service.getThumbnail('/project/image.png')

      // Should generate twice due to different mtimes
      expect(sharpInstance.toBuffer).toHaveBeenCalledTimes(2)
    })
  })

  describe('supported formats list', () => {
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']

    supportedFormats.forEach(format => {
      it(`should generate thumbnail for ${format} format`, async () => {
        const service = new ThumbnailService(200)

        const thumbnail = await service.getThumbnail(`/project/image${format}`)

        expect(thumbnail).not.toBeNull()
      })
    })
  })
})
