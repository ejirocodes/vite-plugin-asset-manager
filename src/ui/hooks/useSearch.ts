import { useState, useCallback } from 'react'
import { getTransport } from '@/ui/lib/transport'
import type { Asset, UseSearchResult } from '../types'

export function useSearch(advancedParams?: URLSearchParams): UseSearchResult {
  const [results, setResults] = useState<Asset[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

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
          new URLSearchParams(advancedParamsString).forEach((v, k) => params.append(k, v))
        }

        const data = await getTransport().searchAssets(params)
        setResults(data.assets)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
        setSearched(true)
      }
    },
    [advancedParamsString]
  )

  const clear = useCallback(() => {
    setResults([])
    setSearched(false)
  }, [])

  return { results, searching, searched, search, clear }
}
