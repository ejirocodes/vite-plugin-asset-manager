import { useState, useEffect, useCallback } from 'react'
import type { AssetGroup, UseAssetsResult } from '../types'
import { useViteWebSocket } from './useViteWebSocket'

export function useAssets(): UseAssetsResult {
  const [groups, setGroups] = useState<AssetGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useViteWebSocket()

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/__asset_manager__/api/assets/grouped')
      if (!res.ok) throw new Error('Failed to fetch assets')
      const data = await res.json()
      setGroups(data.groups)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssets()

    // Subscribe to asset updates via direct WebSocket connection
    const unsubscribe = subscribe('asset-manager:update', () => {
      fetchAssets()
    })

    return unsubscribe
  }, [fetchAssets, subscribe])

  return { groups, total, loading, error, refetch: fetchAssets }
}
