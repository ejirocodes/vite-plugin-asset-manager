import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

let useSSE: typeof import('./useSSE').useSSE

describe('useSSE', () => {
  let mockEventSource: {
    readyState: number
    onopen: ((event: Event) => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null
    close: ReturnType<typeof vi.fn>
    CONNECTING: number
    OPEN: number
    CLOSED: number
  }

  beforeEach(async () => {
    vi.resetModules()

    mockEventSource = {
      readyState: 0, // CONNECTING
      onopen: null,
      onmessage: null,
      onerror: null,
      close: vi.fn(),
      CONNECTING: 0,
      OPEN: 1,
      CLOSED: 2
    }

    const MockEventSourceClass = vi.fn().mockImplementation(() => mockEventSource)
    MockEventSourceClass.CONNECTING = 0
    MockEventSourceClass.OPEN = 1
    MockEventSourceClass.CLOSED = 2

    vi.stubGlobal('EventSource', MockEventSourceClass)

    // Re-import the module with fresh state
    const module = await import('./useSSE')
    useSSE = module.useSSE
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should connect to SSE endpoint on mount', async () => {
    renderHook(() => useSSE())

    expect(globalThis.EventSource).toHaveBeenCalledWith('/__asset_manager__/api/events')
  })

  it('should return subscribe function', () => {
    const { result } = renderHook(() => useSSE())

    expect(result.current.subscribe).toBeInstanceOf(Function)
  })

  it('should subscribe to events and receive messages', async () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler)
    })

    // Simulate open connection
    act(() => {
      mockEventSource.readyState = 1 // OPEN
      mockEventSource.onopen?.(new Event('open'))
    })

    // Simulate message
    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: { foo: 'bar' } })
      })
      mockEventSource.onmessage?.(event)
    })

    expect(handler).toHaveBeenCalledWith({ foo: 'bar' })
  })

  it('should unsubscribe from events', async () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    let unsubscribe: () => void
    act(() => {
      unsubscribe = result.current.subscribe('test-event', handler)
    })

    // Unsubscribe
    act(() => {
      unsubscribe()
    })

    // Simulate message after unsubscribe
    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: {} })
      })
      mockEventSource.onmessage?.(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should ignore connected message type', async () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('connected', handler)
    })

    // Simulate connected message (should be ignored)
    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ type: 'connected' })
      })
      mockEventSource.onmessage?.(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should share connection between multiple hook instances', async () => {
    renderHook(() => useSSE())
    renderHook(() => useSSE())

    // EventSource should only be created once (singleton)
    expect(globalThis.EventSource).toHaveBeenCalledTimes(1)
  })

  it('should close connection when all subscribers unmount', async () => {
    const { unmount: unmount1 } = renderHook(() => useSSE())
    const { unmount: unmount2 } = renderHook(() => useSSE())

    // Both are mounted, EventSource should be created
    expect(globalThis.EventSource).toHaveBeenCalledTimes(1)

    // Unmount first hook
    unmount1()
    expect(mockEventSource.close).not.toHaveBeenCalled()

    // Unmount second hook - connection should close
    unmount2()
    expect(mockEventSource.close).toHaveBeenCalled()
  })

  it('should handle multiple event handlers for same event', async () => {
    const { result } = renderHook(() => useSSE())
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler1)
      result.current.subscribe('test-event', handler2)
    })

    // Simulate message
    act(() => {
      const event = new MessageEvent('message', {
        data: JSON.stringify({ event: 'test-event', data: { test: true } })
      })
      mockEventSource.onmessage?.(event)
    })

    expect(handler1).toHaveBeenCalledWith({ test: true })
    expect(handler2).toHaveBeenCalledWith({ test: true })
  })

  it('should handle JSON parse errors gracefully', async () => {
    const { result } = renderHook(() => useSSE())
    const handler = vi.fn()

    act(() => {
      result.current.subscribe('test-event', handler)
    })

    // Simulate invalid JSON message - should not throw
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

    renderHook(() => useSSE())

    // Open connection
    act(() => {
      mockEventSource.readyState = 1
      mockEventSource.onopen?.(new Event('open'))
    })

    // Simulate error
    act(() => {
      mockEventSource.onerror?.(new Event('error'))
    })

    // Fast-forward past reconnect delay
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // Should attempt to reconnect
    expect(globalThis.EventSource).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})
