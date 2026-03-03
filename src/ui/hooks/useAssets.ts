import { useState, useEffect, useCallback, useRef } from 'react'
import { getTransport } from '@/ui/lib/transport'
import type { AssetGroup, AssetType, UseAssetsResult } from '../types'
import { useAssetUpdates } from './useAssetUpdates'

export function useAssets(
  typeFilter?: AssetType | null,
  unusedFilter?: boolean,
  advancedParams?: URLSearchParams
): UseAssetsResult {
  const [groups, setGroups] = useState<AssetGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useAssetUpdates()
  const initialFetchDone = useRef(false)

  const advancedParamsString = advancedParams?.toString() ?? ''

  const fetchAssets = useCallback(async () => {
    try {
      if (!initialFetchDone.current) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (unusedFilter) params.append('unused', 'true')
      if (advancedParamsString) {
        new URLSearchParams(advancedParamsString).forEach((v, k) => params.append(k, v))
      }

      const data = await getTransport().getGroupedAssets(params)
      setGroups(data.groups)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      initialFetchDone.current = true
    }
  }, [typeFilter, unusedFilter, advancedParamsString])

  useEffect(() => {
    initialFetchDone.current = false
    fetchAssets()

    const unsubscribe = subscribe('asset-manager:update', () => {
      fetchAssets()
    })

    return unsubscribe
  }, [fetchAssets, subscribe])

  return { groups, total, loading, error, refetch: fetchAssets }
}
