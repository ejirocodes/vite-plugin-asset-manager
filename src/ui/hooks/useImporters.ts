import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Importer, UseImportersResult } from '../types'
import { useSSE } from './useSSE'

export function useImporters(assetPath: string): UseImportersResult {
  const [importers, setImporters] = useState<Importer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useSSE()

  const fetchImporters = useCallback(async () => {
    if (!assetPath) {
      setImporters([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/__asset_manager__/api/importers?path=${encodeURIComponent(assetPath)}`
      )
      if (!res.ok) throw new Error('Failed to fetch importers')
      const data = await res.json()
      setImporters(data.importers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [assetPath])

  const openInEditor = useCallback(async (importer: Importer) => {
    try {
      const res = await fetch(
        `/__asset_manager__/api/open-in-editor?` +
          `file=${encodeURIComponent(importer.filePath)}` +
          `&line=${importer.line}` +
          `&column=${importer.column}`,
        { method: 'POST' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to open editor')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open in editor')
    }
  }, [])

  useEffect(() => {
    fetchImporters()

    const unsubscribe = subscribe('asset-manager:importers-update', (data: unknown) => {
      const updateData = data as { affectedAssets?: string[] }
      if (updateData.affectedAssets?.includes(assetPath)) {
        fetchImporters()
      }
    })

    return unsubscribe
  }, [assetPath, fetchImporters, subscribe])

  return { importers, loading, error, openInEditor }
}
