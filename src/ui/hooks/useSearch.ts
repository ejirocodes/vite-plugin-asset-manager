import { useState, useCallback } from 'react'
import type { Asset, UseSearchResult } from '../types'

export function useSearch(advancedParams?: URLSearchParams): UseSearchResult {
  const [results, setResults] = useState<Asset[]>([])
  const [searching, setSearching] = useState(false)

  // Use primitive string for dependency comparison to prevent unnecessary re-renders
  // Vercel best practice: rerender-dependencies
  const advancedParamsString = advancedParams?.toString() ?? ''

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setSearching(true)
      try {
        const params = new URLSearchParams()
        params.append('q', query)
        if (advancedParamsString) {
          // Reconstruct URLSearchParams from string
          const advancedUrlParams = new URLSearchParams(advancedParamsString)
          advancedUrlParams.forEach((value, key) => params.append(key, value))
        }

        const res = await fetch(`/__asset_manager__/api/search?${params.toString()}`)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setResults(data.assets)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    },
    [advancedParamsString]
  )

  const clear = useCallback(() => {
    setResults([])
  }, [])

  return { results, searching, search, clear }
}
