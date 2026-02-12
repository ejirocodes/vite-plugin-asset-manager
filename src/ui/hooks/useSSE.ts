/* global EventSource */
import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { getApiBase } from '@/ui/lib/api-base'

type MessageHandler = (data: unknown) => void

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

interface SSEHook {
  subscribe: (event: string, handler: MessageHandler) => () => void
  status: SSEConnectionStatus
}

let sharedEventSource: EventSource | null = null
const sharedHandlers = new Map<string, Set<MessageHandler>>()
let reconnectTimeout: number | null = null
let reconnectAttempts = 0
let connectionCount = 0

// Connection status tracking
let connectionStatus: SSEConnectionStatus = 'disconnected'
const statusListeners = new Set<() => void>()

function setConnectionStatus(newStatus: SSEConnectionStatus): void {
  if (connectionStatus !== newStatus) {
    connectionStatus = newStatus
    statusListeners.forEach(listener => listener())
  }
}

function subscribeToStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

function getConnectionStatus(): SSEConnectionStatus {
  return connectionStatus
}

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
    setConnectionStatus('connecting')
    const eventSource = new EventSource(`${getApiBase()}/api/events`)
    sharedEventSource = eventSource

    eventSource.onopen = () => {
      reconnectAttempts = 0
      setConnectionStatus('connected')
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
        setConnectionStatus('reconnecting')
        reconnectTimeout = window.setTimeout(() => {
          connect()
        }, RECONNECT_DELAY)
      } else {
        setConnectionStatus('disconnected')
      }
    }
  } catch {
    setConnectionStatus('disconnected')
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
  setConnectionStatus('disconnected')
}

/** @internal Reset module state for testing */
export function __resetForTesting(): void {
  disconnect()
  sharedHandlers.clear()
  connectionCount = 0
  statusListeners.clear()
}

/**
 * Hook to connect to the asset manager's SSE endpoint for real-time updates.
 * Uses a shared singleton EventSource connection for efficiency.
 *
 * @returns {SSEHook} Object containing:
 *   - subscribe: Function to subscribe to SSE events
 *   - status: Current connection status ('connecting' | 'connected' | 'disconnected' | 'reconnecting')
 */
export function useSSE(): SSEHook {
  const status = useSyncExternalStore(subscribeToStatus, getConnectionStatus)

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

  return { subscribe, status }
}
