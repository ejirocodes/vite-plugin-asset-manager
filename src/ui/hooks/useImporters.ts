import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getTransport } from '@/ui/lib/transport'
import type { Importer, UseImportersResult } from '../types'
import { useAssetUpdates } from './useAssetUpdates'

export function useImporters(assetPath: string): UseImportersResult {
  const [importers, setImporters] = useState<Importer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { subscribe } = useAssetUpdates()

  const fetchImporters = useCallback(async () => {
    if (!assetPath) {
      setImporters([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getTransport().getImporters(assetPath)
      setImporters(data.importers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [assetPath])

  const openInEditor = useCallback(async (importer: Importer) => {
    try {
      await getTransport().openInEditor(importer.filePath, importer.line, importer.column)
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
