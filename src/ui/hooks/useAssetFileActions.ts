import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { openAssetInEditor, revealAssetInFinder } from '@/ui/lib/asset-api'
import type { Asset } from '../types'

interface UseAssetFileActionsResult {
  handleOpenInEditor: () => Promise<void>
  handleRevealInFinder: () => Promise<void>
  hasImporters: boolean
  isOpeningEditor: boolean
}

export function useAssetFileActions(asset: Asset): UseAssetFileActionsResult {
  const [isOpeningEditor, setIsOpeningEditor] = useState(false)

  const hasImporters = asset.importersCount > 0

  const handleOpenInEditor = useCallback(async () => {
    if (!hasImporters) {
      toast.error('No source files import this asset')
      return
    }

    setIsOpeningEditor(true)
    try {
      await openAssetInEditor(asset.path)
      toast.success('Opening in editor...')
    } catch (err) {
      toast.error('Failed to open in editor')
      console.error('Open in editor error:', err)
    } finally {
      setIsOpeningEditor(false)
    }
  }, [asset.path, hasImporters])

  const handleRevealInFinder = useCallback(async () => {
    try {
      await revealAssetInFinder(asset.path)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      toast.success(`File revealed in ${isMac ? 'Finder' : 'Explorer'}`)
    } catch (err) {
      toast.error('Failed to reveal file in system explorer')
      console.error('Reveal in finder error:', err)
    }
  }, [asset.path])

  return { handleOpenInEditor, handleRevealInFinder, hasImporters, isOpeningEditor }
}
