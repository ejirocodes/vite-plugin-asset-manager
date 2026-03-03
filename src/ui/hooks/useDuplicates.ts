import { useState, useEffect, useCallback, useRef } from 'react'
import { getTransport } from '@/ui/lib/transport'
import type { Asset, UseDuplicatesResult } from '../types'
import { useAssetUpdates } from './useAssetUpdates'

export function useDuplicates(contentHash: string): UseDuplicatesResult {
  const [duplicates, setDuplicates] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useAssetUpdates()
  const initialFetchDone = useRef(false)

  const fetchDuplicates = useCallback(async () => {
    if (!contentHash) {
      setDuplicates([])
      setLoading(false)
      return
    }
    try {
      if (!initialFetchDone.current) setLoading(true)
      setError(null)
      const data = await getTransport().getDuplicates(contentHash)
      setDuplicates(data.duplicates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      initialFetchDone.current = true
    }
  }, [contentHash])

  useEffect(() => {
    initialFetchDone.current = false
    fetchDuplicates()

    const unsubscribe = subscribe('asset-manager:duplicates-update', () => {
      fetchDuplicates()
    })

    return unsubscribe
  }, [contentHash, fetchDuplicates, subscribe])

  return { duplicates, loading, error }
}
