/* global EventSource */
import { getApiBase } from './api-base'

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

type MessageHandler = (data: unknown) => void

let sharedEventSource: EventSource | null = null
const sharedHandlers = new Map<string, Set<MessageHandler>>()
let reconnectTimeout: number | null = null
let reconnectAttempts = 0
let connectionCount = 0

export function incrementConnectionCount(): void { connectionCount++ }
export function decrementConnectionCount(): void { connectionCount-- }
export function getConnectionCount(): number { return connectionCount }

let connectionStatus: SSEConnectionStatus = 'disconnected'
const statusListeners = new Set<() => void>()

function setConnectionStatus(newStatus: SSEConnectionStatus): void {
  if (connectionStatus !== newStatus) {
    connectionStatus = newStatus
    statusListeners.forEach(l => l())
  }
}

export function subscribeToStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

export function getConnectionStatus(): SSEConnectionStatus {
  return connectionStatus
}

const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 1000

export function connect(): void {
  if (
    sharedEventSource?.readyState === EventSource.OPEN ||
    sharedEventSource?.readyState === EventSource.CONNECTING
  ) return

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
        const message = JSON.parse(event.data as string)
        if (message.type === 'connected') return
        if (message.event) {
          sharedHandlers.get(message.event as string)?.forEach(h => h(message.data))
        }
      } catch {
        // Ignore parse errors
      }
    }

    eventSource.onerror = () => {
      sharedEventSource?.close()
      sharedEventSource = null

      if (getConnectionCount() > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        setConnectionStatus('reconnecting')
        reconnectTimeout = window.setTimeout(connect, RECONNECT_DELAY)
      } else {
        setConnectionStatus('disconnected')
      }
    }
  } catch {
    setConnectionStatus('disconnected')
  }
}

export function disconnect(): void {
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

export function subscribe(event: string, handler: MessageHandler): () => void {
  if (!sharedHandlers.has(event)) sharedHandlers.set(event, new Set())
  sharedHandlers.get(event)!.add(handler)
  return () => {
    const handlers = sharedHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) sharedHandlers.delete(event)
    }
  }
}

export function __resetForTesting(): void {
  disconnect()
  sharedHandlers.clear()
  connectionCount = 0 // eslint-disable-line -- test reset
  statusListeners.clear()
}
