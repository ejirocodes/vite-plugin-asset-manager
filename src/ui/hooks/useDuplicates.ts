import { useState, useEffect, useCallback } from 'react'
import type { Asset, UseDuplicatesResult } from '../types'
import { useSSE } from './useSSE'

export function useDuplicates(contentHash: string | undefined): UseDuplicatesResult {
  const [duplicates, setDuplicates] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useSSE()

  const fetchDuplicates = useCallback(async () => {
    if (!contentHash) {
      setDuplicates([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/__asset_manager__/api/duplicates?hash=${encodeURIComponent(contentHash)}`
      )
      if (!res.ok) throw new Error('Failed to fetch duplicates')
      const data = await res.json()
      setDuplicates(data.duplicates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [contentHash])

  useEffect(() => {
    fetchDuplicates()

    const unsubscribe = subscribe('asset-manager:duplicates-update', () => {
      fetchDuplicates()
    })

    const unsubscribeAssets = subscribe('asset-manager:update', () => {
      fetchDuplicates()
    })

    return () => {
      unsubscribe()
      unsubscribeAssets()
    }
  }, [contentHash, fetchDuplicates, subscribe])

  return { duplicates, loading, error }
}
