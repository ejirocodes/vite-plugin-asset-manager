import { vi } from 'vitest'
import { EventEmitter } from 'events'

export class MockFSWatcher extends EventEmitter {
  private _closed = false

  constructor() {
    super()
  }

  simulateAdd(filePath: string) {
    if (!this._closed) {
      this.emit('add', filePath)
    }
  }

  simulateChange(filePath: string) {
    if (!this._closed) {
      this.emit('change', filePath)
    }
  }

  simulateUnlink(filePath: string) {
    if (!this._closed) {
      this.emit('unlink', filePath)
    }
  }

  simulateReady() {
    if (!this._closed) {
      this.emit('ready')
    }
  }

  simulateError(error: Error) {
    if (!this._closed) {
      this.emit('error', error)
    }
  }

  async close(): Promise<void> {
    this._closed = true
    this.removeAllListeners()
  }

  get closed(): boolean {
    return this._closed
  }
}

export function createMockChokidar() {
  let currentWatcher: MockFSWatcher | null = null

  const watch = vi.fn().mockImplementation(() => {
    currentWatcher = new MockFSWatcher()
    setTimeout(() => {
      currentWatcher?.simulateReady()
    }, 0)
    return currentWatcher
  })

  return {
    watch,
    getCurrentWatcher: () => currentWatcher,
    resetWatcher: () => {
      currentWatcher = null
    }
  }
}

export function mockChokidarModule(mockChokidar: ReturnType<typeof createMockChokidar>) {
  vi.doMock('chokidar', () => ({
    default: { watch: mockChokidar.watch },
    watch: mockChokidar.watch
  }))
}
