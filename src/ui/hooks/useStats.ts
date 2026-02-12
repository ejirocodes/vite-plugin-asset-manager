import { useState, useEffect, useCallback } from 'react'
import { getApiBase } from '@/ui/lib/api-base'
import { useSSE } from './useSSE'

interface Stats {
  total: number
  images: number
  videos: number
  audio: number
  documents: number
  fonts: number
  data: number
  text: number
  other: number
  unused: number
  duplicateGroups: number
  duplicateFiles: number
  extensionBreakdown: Record<string, number>
}

interface UseStatsResult {
  stats: Stats
  loading: boolean
  error: string | null
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    fonts: 0,
    data: 0,
    text: 0,
    other: 0,
    unused: 0,
    duplicateGroups: 0,
    duplicateFiles: 0,
    extensionBreakdown: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useSSE()

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`${getApiBase()}/api/stats`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats({
        total: data.total,
        images: data.byType.image,
        videos: data.byType.video,
        audio: data.byType.audio,
        documents: data.byType.document,
        fonts: data.byType.font,
        data: data.byType.data,
        text: data.byType.text,
        other: data.byType.other,
        unused: data.unused,
        duplicateGroups: data.duplicateGroups ?? 0,
        duplicateFiles: data.duplicateFiles ?? 0,
        extensionBreakdown: data.extensionBreakdown ?? {}
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()

    const unsubscribe = subscribe('asset-manager:update', () => {
      fetchStats()
    })

    return unsubscribe
  }, [fetchStats, subscribe])

  return { stats, loading, error }
}
