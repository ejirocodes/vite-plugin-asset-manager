import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('launch-editor', () => ({
  default: vi.fn()
}))

import { launchEditor } from '../../src/server/editor-launcher'
import launch from 'launch-editor'

const mockLaunch = vi.mocked(launch)

describe('launchEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should launch editor with correct file specification', async () => {
    mockLaunch.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await launchEditor('/project/src/App.tsx', 10, 5, 'code')

    expect(mockLaunch).toHaveBeenCalledWith(
      '/project/src/App.tsx:10:5',
      'code',
      expect.any(Function)
    )
  })

  it('should resolve on successful launch', async () => {
    mockLaunch.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await expect(
      launchEditor('/project/src/index.ts', 1, 1, 'code')
    ).resolves.toBeUndefined()
  })

  it('should reject with error message on failure', async () => {
    mockLaunch.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', 'Could not open editor')
    })

    await expect(
      launchEditor('/project/src/App.tsx', 10, 5, 'code')
    ).rejects.toThrow('Could not open editor')
  })

  it('should support different editor types', async () => {
    mockLaunch.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await launchEditor('/project/file.ts', 1, 1, 'vim')
    expect(mockLaunch).toHaveBeenCalledWith(
      '/project/file.ts:1:1',
      'vim',
      expect.any(Function)
    )

    await launchEditor('/project/file.ts', 1, 1, 'webstorm')
    expect(mockLaunch).toHaveBeenCalledWith(
      '/project/file.ts:1:1',
      'webstorm',
      expect.any(Function)
    )
  })

  it('should format file spec with line and column', async () => {
    mockLaunch.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await launchEditor('/path/to/file.js', 42, 15, 'code')

    expect(mockLaunch).toHaveBeenCalledWith(
      '/path/to/file.js:42:15',
      'code',
      expect.any(Function)
    )
  })
})
