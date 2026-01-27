import { useState, useCallback } from 'react'
import type { Asset, UseSearchResult } from '../types'

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<Asset[]>([])
  const [searching, setSearching] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/__asset-manager/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data.assets)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
  }, [])

  return { results, searching, search, clear }
}
