import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { getTransport, type ConnectionStatus } from '@/ui/lib/transport'

interface AssetUpdatesHook {
  subscribe: (event: string, handler: (data: unknown) => void) => () => void
  status: ConnectionStatus
}

export function useAssetUpdates(): AssetUpdatesHook {
  const transport = getTransport()

  const status = useSyncExternalStore(
    listener => transport.onStatusChange(listener),
    () => transport.getStatus()
  )

  useEffect(() => {
    transport.connect()
    return () => {
      transport.disconnect()
    }
  }, [transport])

  const subscribe = useCallback(
    (event: string, handler: (data: unknown) => void) => transport.subscribe(event, handler),
    [transport]
  )

  return { subscribe, status }
}
