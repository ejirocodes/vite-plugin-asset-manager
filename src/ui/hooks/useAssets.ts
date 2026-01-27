import { useState, useEffect, useCallback } from 'react'
import type { AssetGroup, AssetType, UseAssetsResult } from '../types'
import { useSSE } from './useSSE'

export function useAssets(typeFilter?: AssetType | null, unusedFilter?: boolean): UseAssetsResult {
  const [groups, setGroups] = useState<AssetGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useSSE()

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (unusedFilter) params.append('unused', 'true')

      const queryString = params.toString()
      const url = queryString
        ? `/__asset_manager__/api/assets/grouped?${queryString}`
        : '/__asset_manager__/api/assets/grouped'

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch assets')
      const data = await res.json()
      setGroups(data.groups)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, unusedFilter])

  useEffect(() => {
    fetchAssets()

    const unsubscribe = subscribe('asset-manager:update', () => {
      fetchAssets()
    })

    return unsubscribe
  }, [fetchAssets, subscribe])

  return { groups, total, loading, error, refetch: fetchAssets }
}
