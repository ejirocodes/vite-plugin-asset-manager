import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useIgnoredAssets } from '../providers/ignored-assets-provider'
import { useImporters } from './useImporters'
import { useBulkOperations } from './useBulkOperations'
import { generateCodeSnippets, type SnippetType } from '@/ui/lib/code-snippets'
import type { Asset } from '../types'

interface UseAssetActionsProps {
  asset: Asset
  onPreview?: (asset: Asset) => void
}

type CopyState = 'idle' | 'copied'

interface UseAssetActionsResult {
  handlePreview: () => void
  handleCopyPath: () => Promise<void>
  handleCopyImportCode: (snippetType: SnippetType) => Promise<void>
  handleOpenInEditor: () => Promise<void>
  handleRevealInFinder: () => Promise<void>
  handleToggleIgnore: () => void
  handleDelete: () => Promise<void>

  ignored: boolean
  hasImporters: boolean
  copyPathState: CopyState
  copyCodeState: CopyState
  isDeleting: boolean
  isOpeningEditor: boolean
}

export function useAssetActions({
  asset,
  onPreview
}: UseAssetActionsProps): UseAssetActionsResult {
  const [copyPathState, setCopyPathState] = useState<CopyState>('idle')
  const [copyCodeState, setCopyCodeState] = useState<CopyState>('idle')
  const [isOpeningEditor, setIsOpeningEditor] = useState(false)

  const { isIgnored, toggleIgnored } = useIgnoredAssets()
  const { importers, openInEditor } = useImporters(asset.path)
  const { isDeleting, bulkDelete } = useBulkOperations()

  const ignored = isIgnored(asset.path)
  const hasImporters = importers.length > 0

  const handlePreview = useCallback(() => {
    onPreview?.(asset)
  }, [asset, onPreview])

  const handleCopyPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(asset.path)
      setCopyPathState('copied')
      toast.success('Path copied to clipboard')
      setTimeout(() => setCopyPathState('idle'), 2000)
    } catch (err) {
      toast.error('Failed to copy path to clipboard')
      console.error('Copy path error:', err)
    }
  }, [asset.path])

  const handleCopyImportCode = useCallback(
    async (snippetType: SnippetType) => {
      try {
        const snippets = generateCodeSnippets(asset)
        const snippet = snippets.find(s => s.type === snippetType)

        if (!snippet) {
          toast.error('Import code not available for this asset type')
          return
        }

        await navigator.clipboard.writeText(snippet.code)
        setCopyCodeState('copied')
        toast.success(`${snippet.label} code copied to clipboard`)
        setTimeout(() => setCopyCodeState('idle'), 2000)
      } catch (err) {
        toast.error('Failed to copy import code')
        console.error('Copy import code error:', err)
      }
    },
    [asset]
  )

  const handleOpenInEditor = useCallback(async () => {
    if (!hasImporters) {
      toast.error('No source files import this asset')
      return
    }

    setIsOpeningEditor(true)
    try {
      await openInEditor(importers[0])
      toast.success('Opening in editor...')
    } catch (err) {
      toast.error('Failed to open in editor')
      console.error('Open in editor error:', err)
    } finally {
      setIsOpeningEditor(false)
    }
  }, [importers, hasImporters, openInEditor])

  const handleRevealInFinder = useCallback(async () => {
    try {
      const response = await fetch(
        `/__asset_manager__/api/reveal-in-finder?path=${encodeURIComponent(asset.path)}`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reveal file')
      }

      // Detect platform using userAgent (modern approach)
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      toast.success(`File revealed in ${isMac ? 'Finder' : 'Explorer'}`)
    } catch (err) {
      toast.error('Failed to reveal file in system explorer')
      console.error('Reveal in finder error:', err)
    }
  }, [asset.path])

  const handleToggleIgnore = useCallback(() => {
    toggleIgnored(asset.path)
    toast.success(ignored ? 'Asset unmarked as ignored' : 'Asset marked as ignored')
  }, [asset.path, ignored, toggleIgnored])

  const handleDelete = useCallback(async () => {
    try {
      const success = await bulkDelete([asset])
      if (success) {
        toast.success('Asset deleted successfully')
      }
    } catch (err) {
      toast.error('Failed to delete asset')
      console.error('Delete error:', err)
    }
  }, [asset, bulkDelete])

  return {
    handlePreview,
    handleCopyPath,
    handleCopyImportCode,
    handleOpenInEditor,
    handleRevealInFinder,
    handleToggleIgnore,
    handleDelete,

    ignored,
    hasImporters,
    copyPathState,
    copyCodeState,
    isDeleting,
    isOpeningEditor
  }
}
