import { vi } from 'vitest'

type LaunchEditorCallback = (fileName: string, errorMsg: string | null) => void

export function createMockLaunchEditor() {
  const launch = vi.fn().mockImplementation(
    (
      fileSpec: string,
      _editor: string,
      callback: LaunchEditorCallback
    ) => {
      setTimeout(() => {
        callback(fileSpec, null)
      }, 0)
    }
  )

  return {
    launch,

    simulateError(errorMessage: string) {
      launch.mockImplementationOnce(
        (fileSpec: string, _editor: string, callback: LaunchEditorCallback) => {
          setTimeout(() => {
            callback(fileSpec, errorMessage)
          }, 0)
        }
      )
    },

    simulateEditorNotFound() {
      launch.mockImplementationOnce(
        (fileSpec: string, _editor: string, callback: LaunchEditorCallback) => {
          setTimeout(() => {
            callback(fileSpec, 'Could not open editor')
          }, 0)
        }
      )
    },

    reset() {
      launch.mockImplementation(
        (fileSpec: string, _editor: string, callback: LaunchEditorCallback) => {
          setTimeout(() => {
            callback(fileSpec, null)
          }, 0)
        }
      )
    }
  }
}

export function mockLaunchEditorModule(
  mockLaunchEditor: ReturnType<typeof createMockLaunchEditor>
) {
  vi.doMock('launch-editor', () => ({
    default: mockLaunchEditor.launch
  }))
}
