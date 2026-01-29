/* global EventSource */
import { useEffect, useCallback } from 'react'

type MessageHandler = (data: unknown) => void

interface SSEHook {
  subscribe: (event: string, handler: MessageHandler) => () => void
}

let sharedEventSource: EventSource | null = null
const sharedHandlers = new Map<string, Set<MessageHandler>>()
let reconnectTimeout: number | null = null
let reconnectAttempts = 0
let connectionCount = 0

const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 1000

function connect(): void {
  if (
    sharedEventSource?.readyState === EventSource.OPEN ||
    sharedEventSource?.readyState === EventSource.CONNECTING
  ) {
    return
  }

  try {
    const eventSource = new EventSource('/__asset_manager__/api/events')
    sharedEventSource = eventSource

    eventSource.onopen = () => {
      reconnectAttempts = 0
    }

    eventSource.onmessage = event => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'connected') {
          return
        }

        if (message.event) {
          const handlers = sharedHandlers.get(message.event)
          if (handlers) {
            handlers.forEach(handler => handler(message.data))
          }
        }
      } catch {}
    }

    eventSource.onerror = () => {
      sharedEventSource?.close()
      sharedEventSource = null

      if (connectionCount > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        reconnectTimeout = window.setTimeout(() => {
          connect()
        }, RECONNECT_DELAY)
      }
    }
  } catch {}
}

function disconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  if (sharedEventSource) {
    sharedEventSource.close()
    sharedEventSource = null
  }
  reconnectAttempts = 0
}

/** @internal Reset module state for testing */
export function __resetForTesting(): void {
  disconnect()
  sharedHandlers.clear()
  connectionCount = 0
}

/**
 * Hook to connect to the asset manager's SSE endpoint for real-time updates.
 * Uses a shared singleton EventSource connection for efficiency.
 */
export function useSSE(): SSEHook {
  useEffect(() => {
    connectionCount++
    connect()

    return () => {
      connectionCount--
      if (connectionCount === 0) {
        disconnect()
      }
    }
  }, [])

  const subscribe = useCallback((event: string, handler: MessageHandler) => {
    if (!sharedHandlers.has(event)) {
      sharedHandlers.set(event, new Set())
    }
    sharedHandlers.get(event)!.add(handler)

    return () => {
      const handlers = sharedHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          sharedHandlers.delete(event)
        }
      }
    }
  }, [])

  return { subscribe }
}
