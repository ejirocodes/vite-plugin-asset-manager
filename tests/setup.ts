import { vi, beforeEach, afterEach } from 'vitest'
import type { Asset, Importer, AssetType, ImportType } from '../src/shared/types'

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

if (typeof window !== 'undefined') {
  await import('./setup-ui')
}

export function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  const path = overrides.path ?? 'test/image.png'
  const name = overrides.name ?? path.split('/').pop() ?? 'image.png'
  const extension = overrides.extension ?? `.${name.split('.').pop()}`

  return {
    id: Buffer.from(path).toString('base64url'),
    name,
    path,
    absolutePath: `/project/${path}`,
    extension,
    type: 'image' as AssetType,
    size: 1024,
    mtime: Date.now(),
    directory: path.split('/').slice(0, -1).join('/') || '.',
    ...overrides
  }
}

export function createMockImporter(overrides: Partial<Importer> = {}): Importer {
  return {
    filePath: 'src/App.tsx',
    absolutePath: '/project/src/App.tsx',
    line: 5,
    column: 1,
    importType: 'es-import' as ImportType,
    snippet: "import logo from './assets/logo.png'",
    ...overrides
  }
}

declare global {
  var testUtils: {
    createMockAsset: typeof createMockAsset
    createMockImporter: typeof createMockImporter
  }
}

globalThis.testUtils = {
  createMockAsset,
  createMockImporter
}
