import { useState, useCallback } from 'react'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset, UseSearchResult } from '../types'

export function useSearch(advancedParams?: URLSearchParams): UseSearchResult {
  const [results, setResults] = useState<Asset[]>([])
  const [searching, setSearching] = useState(false)

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
          const advancedUrlParams = new URLSearchParams(advancedParamsString)
          advancedUrlParams.forEach((value, key) => params.append(key, value))
        }

        const res = await fetch(`${getApiBase()}/api/search?${params.toString()}`)
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
