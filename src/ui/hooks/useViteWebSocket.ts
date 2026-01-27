import { useEffect, useCallback } from 'react'

type MessageHandler = (data: unknown) => void

interface SSEHook {
  subscribe: (event: string, handler: MessageHandler) => () => void
}

// Debug logging prefix
const DEBUG_PREFIX = '[Asset Manager SSE]'

// Singleton EventSource connection shared across all hook instances
let sharedEventSource: EventSource | null = null
const sharedHandlers = new Map<string, Set<MessageHandler>>()
let reconnectTimeout: number | null = null
let reconnectAttempts = 0
let connectionCount = 0

const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 1000

function connect(): void {
  if (sharedEventSource?.readyState === EventSource.OPEN || sharedEventSource?.readyState === EventSource.CONNECTING) {
    console.log(DEBUG_PREFIX, 'Already connected or connecting')
    return
  }

  // SSE endpoint URL
  const sseUrl = '/__asset_manager__/api/events'

  console.log(DEBUG_PREFIX, 'Connecting to:', sseUrl)

  try {
    const eventSource = new EventSource(sseUrl)
    sharedEventSource = eventSource

    eventSource.onopen = () => {
      console.log(DEBUG_PREFIX, 'Connected successfully')
      reconnectAttempts = 0
    }

    eventSource.onmessage = event => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'connected') {
          console.log(DEBUG_PREFIX, 'Received connection confirmation')
          return
        }

        // Handle asset manager events
        if (message.event) {
          console.log(DEBUG_PREFIX, 'Event received:', message.event, message.data)
          const handlers = sharedHandlers.get(message.event)
          if (handlers) {
            console.log(DEBUG_PREFIX, `Found ${handlers.size} handler(s) for event:`, message.event)
            handlers.forEach(handler => handler(message.data))
          } else {
            console.log(DEBUG_PREFIX, 'No handlers registered for event:', message.event)
          }
        }
      } catch (err) {
        console.error(DEBUG_PREFIX, 'Failed to parse message:', err)
      }
    }

    eventSource.onerror = () => {
      console.log(DEBUG_PREFIX, 'Connection error or closed')
      sharedEventSource?.close()
      sharedEventSource = null

      // Attempt to reconnect if there are active subscribers
      if (connectionCount > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        console.log(DEBUG_PREFIX, `Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
        reconnectTimeout = window.setTimeout(() => {
          connect()
        }, RECONNECT_DELAY)
      }
    }
  } catch (err) {
    console.error(DEBUG_PREFIX, 'Failed to create EventSource:', err)
  }
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

/**
 * Hook to connect to the asset manager's SSE endpoint for real-time updates.
 * Uses a shared singleton EventSource connection for efficiency.
 */
export function useViteWebSocket(): SSEHook {
  useEffect(() => {
    connectionCount++
    connect()

    return () => {
      connectionCount--
      // Only disconnect when no components are using the hook
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
    console.log(DEBUG_PREFIX, 'Subscribed to event:', event, '(total handlers:', sharedHandlers.get(event)!.size, ')')

    // Return unsubscribe function
    return () => {
      const handlers = sharedHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        console.log(DEBUG_PREFIX, 'Unsubscribed from event:', event)
        if (handlers.size === 0) {
          sharedHandlers.delete(event)
        }
      }
    }
  }, [])

  return { subscribe }
}
