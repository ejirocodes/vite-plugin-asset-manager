import { useState, useEffect, useCallback, useRef } from 'react'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset, UseDuplicatesResult } from '../types'
import { useSSE } from './useSSE'

export function useDuplicates(contentHash: string): UseDuplicatesResult {
  const [duplicates, setDuplicates] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useSSE()
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
      const res = await fetch(
        `${getApiBase()}/api/duplicates?hash=${encodeURIComponent(contentHash)}`
      )
      if (!res.ok) throw new Error('Failed to fetch duplicates')
      const data = await res.json()
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
