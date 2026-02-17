import { vi } from 'vitest'

export function createMockSharp() {
  const mockBuffer = Buffer.from('mock-thumbnail-data')

  const sharpInstance = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(mockBuffer),
    metadata: vi.fn().mockResolvedValue({
      width: 200,
      height: 200,
      format: 'jpeg'
    })
  }

  const sharp = vi.fn().mockReturnValue(sharpInstance)

  return {
    sharp,
    sharpInstance,
    mockBuffer,

    simulateError(error: Error) {
      sharpInstance.toBuffer.mockRejectedValueOnce(error)
    },

    simulateMetadataError(error: Error) {
      sharpInstance.metadata.mockRejectedValueOnce(error)
    },

    reset() {
      sharpInstance.toBuffer.mockResolvedValue(mockBuffer)
      sharpInstance.metadata.mockResolvedValue({
        width: 200,
        height: 200,
        format: 'jpeg'
      })
    },

    setMetadata(metadata: { width?: number; height?: number; format?: string }) {
      sharpInstance.metadata.mockResolvedValue({
        width: metadata.width ?? 200,
        height: metadata.height ?? 200,
        format: metadata.format ?? 'jpeg'
      })
    }
  }
}

export function mockSharpModule(mockSharp: ReturnType<typeof createMockSharp>) {
  vi.doMock('sharp', () => ({
    default: mockSharp.sharp
  }))
}
