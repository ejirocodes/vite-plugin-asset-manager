import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLaunchEditorFn } = vi.hoisted(() => ({
  mockLaunchEditorFn: vi.fn()
}))

vi.mock('launch-editor', () => ({
  default: mockLaunchEditorFn
}))

import { launchEditor } from '../../packages/core/src/services/editor-launcher'

// TODO: Fix launch-editor mocking - tests are timing out
describe.skip('launchEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default implementation: successful launch (call callback synchronously)
    mockLaunchEditorFn.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })
  })

  it('should launch editor with correct file specification', async () => {
    await launchEditor('/project/src/App.tsx', 10, 5, 'code')

    expect(mockLaunchEditorFn).toHaveBeenCalledWith(
      '/project/src/App.tsx:10:5',
      'code',
      expect.any(Function)
    )
  })

  it('should resolve on successful launch', async () => {
    mockLaunchEditorFn.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await expect(
      launchEditor('/project/src/index.ts', 1, 1, 'code')
    ).resolves.toBeUndefined()
  })

  it('should reject with error message on failure', async () => {
    mockLaunchEditorFn.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', 'Could not open editor')
    })

    await expect(
      launchEditor('/project/src/App.tsx', 10, 5, 'code')
    ).rejects.toThrow('Could not open editor')
  })

  it('should support different editor types', async () => {
    mockLaunchEditorFn.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await launchEditor('/project/file.ts', 1, 1, 'vim')
    expect(mockLaunchEditorFn).toHaveBeenCalledWith(
      '/project/file.ts:1:1',
      'vim',
      expect.any(Function)
    )

    await launchEditor('/project/file.ts', 1, 1, 'webstorm')
    expect(mockLaunchEditorFn).toHaveBeenCalledWith(
      '/project/file.ts:1:1',
      'webstorm',
      expect.any(Function)
    )
  })

  it('should format file spec with line and column', async () => {
    mockLaunchEditorFn.mockImplementation((_fileSpec, _editor, callback) => {
      callback('', null)
    })

    await launchEditor('/path/to/file.js', 42, 15, 'code')

    expect(mockLaunchEditorFn).toHaveBeenCalledWith(
      '/path/to/file.js:42:15',
      'code',
      expect.any(Function)
    )
  })
})
