import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { generateCodeSnippets, type SnippetType } from '@/ui/lib/code-snippets'
import type { Asset } from '../types'

type CopyState = 'idle' | 'copied'

interface UseAssetClipboardResult {
  handleCopyPath: () => Promise<void>
  handleCopyImportCode: (snippetType: SnippetType) => Promise<void>
  copyPathState: CopyState
  copyCodeState: CopyState
}

export function useAssetClipboard(asset: Asset): UseAssetClipboardResult {
  const [copyPathState, setCopyPathState] = useState<CopyState>('idle')
  const [copyCodeState, setCopyCodeState] = useState<CopyState>('idle')

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

  return { handleCopyPath, handleCopyImportCode, copyPathState, copyCodeState }
}
