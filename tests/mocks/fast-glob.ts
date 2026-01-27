import { vi } from 'vitest'

export interface MockFile {
  path: string
  stats?: {
    size: number
    mtimeMs: number
  }
}

export interface MockFastGlobOptions {
  files?: MockFile[]
}

export function createMockFastGlob(options: MockFastGlobOptions = {}) {
  const { files = [] } = options

  const mockFg = vi.fn().mockImplementation(async (_patterns: string | string[]) => {
    return files.map((file) => ({
      path: file.path,
      stats: file.stats || { size: 1024, mtimeMs: Date.now() }
    }))
  })

  const setFiles = (newFiles: MockFile[]) => {
    mockFg.mockImplementation(async () => {
      return newFiles.map((file) => ({
        path: file.path,
        stats: file.stats || { size: 1024, mtimeMs: Date.now() }
      }))
    })
  }

  return {
    default: mockFg,
    mockFg,
    setFiles
  }
}

export function mockFastGlobModule(mockFg: ReturnType<typeof createMockFastGlob>) {
  vi.doMock('fast-glob', () => ({
    default: mockFg.mockFg
  }))
}
