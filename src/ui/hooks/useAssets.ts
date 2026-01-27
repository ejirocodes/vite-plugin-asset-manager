import { useState, useEffect, useCallback } from 'react'
import type { AssetGroup } from '../types'

interface UseAssetsResult {
  groups: AssetGroup[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAssets(): UseAssetsResult {
  const [groups, setGroups] = useState<AssetGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/__asset-manager/api/assets/grouped')
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

    // Listen for real-time updates
    if (import.meta.hot) {
      import.meta.hot.on('asset-manager:update', () => {
        fetchAssets()
      })
    }
  }, [fetchAssets])

  return { groups, total, loading, error, refetch: fetchAssets }
}
