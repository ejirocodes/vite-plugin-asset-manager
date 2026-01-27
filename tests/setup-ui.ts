import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

export class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  url: string
  readyState: number = MockEventSource.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 0)
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }

  simulateMessage(data: unknown) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data)
    })
    if (this.onmessage) {
      this.onmessage(event)
    }
  }

  simulateError() {
    this.readyState = MockEventSource.CLOSED
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

vi.stubGlobal('EventSource', MockEventSource)

export const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

export const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  readText: vi.fn().mockResolvedValue('')
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true
})

beforeEach(() => {
  mockFetch.mockReset()
  mockClipboard.writeText.mockReset().mockResolvedValue(undefined)
  mockClipboard.readText.mockReset().mockResolvedValue('')
})
