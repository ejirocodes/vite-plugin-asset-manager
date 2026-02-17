import { vi } from 'vitest'
import { Volume, createFsFromVolume } from 'memfs'
import type { IFs } from 'memfs'
import path from 'path'

export interface MockFsInstance {
  vol: InstanceType<typeof Volume>
  fs: IFs
  promises: IFs['promises']
  addFile: (filePath: string, content: string | Buffer) => void
  removeFile: (filePath: string) => void
  reset: (newFiles?: Record<string, string | Buffer>) => void
}

export function createMockFs(
  files: Record<string, string | Buffer> = {}
): MockFsInstance {
  const vol = Volume.fromJSON({}, '/project')

  Object.entries(files).forEach(([filePath, content]) => {
    const normalizedPath = filePath.startsWith('/') ? filePath : `/project/${filePath}`
    const dir = path.dirname(normalizedPath)
    vol.mkdirSync(dir, { recursive: true })
    vol.writeFileSync(normalizedPath, content)
  })

  const fs = createFsFromVolume(vol)

  return {
    vol,
    fs,
    promises: fs.promises,

    addFile(filePath: string, content: string | Buffer) {
      const normalizedPath = filePath.startsWith('/')
        ? filePath
        : `/project/${filePath}`
      const dir = path.dirname(normalizedPath)
      vol.mkdirSync(dir, { recursive: true })
      vol.writeFileSync(normalizedPath, content)
    },

    removeFile(filePath: string) {
      const normalizedPath = filePath.startsWith('/')
        ? filePath
        : `/project/${filePath}`
      try {
        vol.unlinkSync(normalizedPath)
      } catch {
        // ignore
      }
    },

    reset(newFiles?: Record<string, string | Buffer>) {
      vol.reset()
      vol.mkdirSync('/project', { recursive: true })
      if (newFiles) {
        Object.entries(newFiles).forEach(([filePath, content]) => {
          const normalizedPath = filePath.startsWith('/')
            ? filePath
            : `/project/${filePath}`
          const dir = path.dirname(normalizedPath)
          vol.mkdirSync(dir, { recursive: true })
          vol.writeFileSync(normalizedPath, content)
        })
      }
    }
  }
}

export function mockFsModule(mockFs: MockFsInstance) {
  vi.doMock('fs', () => mockFs.fs)
  vi.doMock('fs/promises', () => mockFs.promises)
}
