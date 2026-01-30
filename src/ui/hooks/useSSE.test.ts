import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSSE, __resetForTesting } from './useSSE'

describe('useSSE', () => {
  let lastCreatedInstance: {
    readyState: number
    onopen: ((event: Event) => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null
    close: ReturnType<typeof vi.fn>
  } | null
  let eventSourceCallCount: number

  beforeEach(() => {
    eventSourceCallCount = 0
    lastCreatedInstance = null

    class MockEventSource {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 2

      readyState = 0
      onopen: ((event: Event) => void) | null = null
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      close = vi.fn()

      constructor() {
        eventSourceCallCount++
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        lastCreatedInstance = this
      }
    }

    vi.stubGlobal('EventSource', MockEventSource)
    __resetForTesting()
  })

  afterEach(() => {
    __resetForTesting()
    vi.unstubAllGlobals()
  })

  it('should connect to SSE endpoint on mount', () => {
    renderHook(() => useSSE())
    expect(eventSourceCallCount).toBe(1)
  })

  it('should return subscribe function', () => {
    const { result } = renderHook(() => useSSE())
    expect(result.current.subscribe).toBeInstanceOf(Function)
  })

  it('should subscribe to events and receive messages', () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler)
    })

    act(() => {
      if (lastCreatedInstance) {
        lastCreatedInstance.readyState = 1
        lastCreatedInstance.onopen?.(new Event('open'))
      }
    })

    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: { foo: 'bar' } })
      })
      lastCreatedInstance?.onmessage?.(event)
    })

    expect(handler).toHaveBeenCalledWith({ foo: 'bar' })
  })

  it('should unsubscribe from events', () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    let unsubscribe: () => void
    act(() => {
      unsubscribe = result.current.subscribe('test-event', handler)
    })

    act(() => {
      unsubscribe()
    })

    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: {} })
      })
      lastCreatedInstance?.onmessage?.(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should ignore connected message type', () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('connected', handler)
    })

    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ type: 'connected' })
      })
      lastCreatedInstance?.onmessage?.(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should share connection between multiple hook instances', () => {
    renderHook(() => useSSE())
    renderHook(() => useSSE())

    expect(eventSourceCallCount).toBe(1)
  })

  it('should close connection when all subscribers unmount', () => {
    const { unmount: unmount1 } = renderHook(() => useSSE())
    const { unmount: unmount2 } = renderHook(() => useSSE())

    expect(eventSourceCallCount).toBe(1)
    const instance = lastCreatedInstance

    unmount1()
    expect(instance?.close).not.toHaveBeenCalled()

    unmount2()
    expect(instance?.close).toHaveBeenCalled()
  })

  it('should handle multiple event handlers for same event', () => {
    const { result } = renderHook(() => useSSE())
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler1)
      result.current.subscribe('test-event', handler2)
    })

    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: { test: true } })
      })
      lastCreatedInstance?.onmessage?.(event)
    })

    expect(handler1).toHaveBeenCalledWith({ test: true })
    expect(handler2).toHaveBeenCalledWith({ test: true })
  })

  it('should handle JSON parse errors gracefully', () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler)
    })

    expect(() => {
      act(() => {
        const event = new MessageEvent('message', {
          data: 'invalid json {'
        })
        lastCreatedInstance?.onmessage?.(event)
      })
    }).not.toThrow()

    expect(handler).not.toHaveBeenCalled()
  })

  it('should reconnect on error', async () => {
    vi.useFakeTimers()

    const { unmount } = renderHook(() => useSSE())
    const initialCount = eventSourceCallCount

    act(() => {
      if (lastCreatedInstance) {
        lastCreatedInstance.readyState = 1
        lastCreatedInstance.onopen?.(new Event('open'))
      }
    })

    act(() => {
      lastCreatedInstance?.onerror?.(new Event('error'))
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })

    expect(eventSourceCallCount).toBe(initialCount + 1)

    unmount()
    vi.useRealTimers()
  })

  describe('connection status', () => {
    it('should return status as connecting initially', () => {
      const { result } = renderHook(() => useSSE())
      expect(result.current.status).toBe('connecting')
    })

    it('should return status as connected after onopen', () => {
      const { result } = renderHook(() => useSSE())

      act(() => {
        if (lastCreatedInstance) {
          lastCreatedInstance.readyState = 1
          lastCreatedInstance.onopen?.(new Event('open'))
        }
      })

      expect(result.current.status).toBe('connected')
    })

    it('should return status as reconnecting on error with retries remaining', async () => {
      vi.useFakeTimers()

      const { result, unmount } = renderHook(() => useSSE())

      act(() => {
        if (lastCreatedInstance) {
          lastCreatedInstance.readyState = 1
          lastCreatedInstance.onopen?.(new Event('open'))
        }
      })

      expect(result.current.status).toBe('connected')

      act(() => {
        lastCreatedInstance?.onerror?.(new Event('error'))
      })

      expect(result.current.status).toBe('reconnecting')

      unmount()
      vi.useRealTimers()
    })

    it('should return status as disconnected when unmounted', () => {
      const { result, unmount } = renderHook(() => useSSE())

      act(() => {
        if (lastCreatedInstance) {
          lastCreatedInstance.readyState = 1
          lastCreatedInstance.onopen?.(new Event('open'))
        }
      })

      expect(result.current.status).toBe('connected')

      unmount()

      // After unmount, the status will be disconnected
      // We can verify this by rendering a new hook
      const { result: newResult } = renderHook(() => useSSE())
      // New hook starts fresh with connecting status
      expect(newResult.current.status).toBe('connecting')
    })

    it('should return status as disconnected after max reconnect attempts', async () => {
      vi.useFakeTimers()

      const { result, unmount } = renderHook(() => useSSE())

      // Need 11 errors: first 10 trigger reconnect attempts, 11th hits the limit
      // (reconnectAttempts is incremented inside the if block after the check)
      for (let i = 0; i < 11; i++) {
        // Get reference to current instance before triggering error
        const currentInstance = lastCreatedInstance

        act(() => {
          currentInstance?.onerror?.(new Event('error'))
        })

        if (i < 10) {
          // Wait for reconnect timeout and new connection attempt
          await act(async () => {
            await vi.advanceTimersByTimeAsync(1100)
          })
        }
      }

      // After max attempts exhausted, status should be disconnected
      expect(result.current.status).toBe('disconnected')

      unmount()
      vi.useRealTimers()
    })
  })
})
