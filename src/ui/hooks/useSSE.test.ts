import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSSE, __resetForTesting } from './useSSE'

describe('useSSE', () => {
  let mockEventSource: {
    readyState: number
    onopen: ((event: Event) => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null
    close: ReturnType<typeof vi.fn>
  }
  let eventSourceCallCount: number

  beforeEach(() => {
    eventSourceCallCount = 0

    mockEventSource = {
      readyState: 0,
      onopen: null,
      onmessage: null,
      onerror: null,
      close: vi.fn()
    }

    class MockEventSource {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 2

      constructor() {
        eventSourceCallCount++
        Object.assign(this, mockEventSource)
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
      mockEventSource.readyState = 1
      mockEventSource.onopen?.(new Event('open'))
    })

    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: { foo: 'bar' } })
      })
      mockEventSource.onmessage?.(event)
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
      mockEventSource.onmessage?.(event)
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
      mockEventSource.onmessage?.(event)
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

    unmount1()
    expect(mockEventSource.close).not.toHaveBeenCalled()

    unmount2()
    expect(mockEventSource.close).toHaveBeenCalled()
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
      mockEventSource.onmessage?.(event)
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
        mockEventSource.onmessage?.(event)
      })
    }).not.toThrow()

    expect(handler).not.toHaveBeenCalled()
  })

  it('should reconnect on error', async () => {
    vi.useFakeTimers()

    const { unmount } = renderHook(() => useSSE())
    const initialCount = eventSourceCallCount

    act(() => {
      mockEventSource.readyState = 1
      mockEventSource.onopen?.(new Event('open'))
    })

    act(() => {
      mockEventSource.onerror?.(new Event('error'))
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })

    expect(eventSourceCallCount).toBe(initialCount + 1)

    unmount()
    vi.useRealTimers()
  })
})
