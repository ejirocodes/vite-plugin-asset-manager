import { useCallback } from 'react'
import { toast } from 'sonner'
import { useIgnoredAssets } from '../providers/ignored-assets-provider'
import { useBulkOperations } from './useBulkOperations'
import type { Asset } from '../types'

interface UseAssetMutationsResult {
  handleDelete: () => Promise<boolean>
  handleToggleIgnore: () => void
  ignored: boolean
  isDeleting: boolean
}

export function useAssetMutations(asset: Asset): UseAssetMutationsResult {
  const { isIgnored, toggleIgnored } = useIgnoredAssets()
  const { isDeleting, bulkDelete } = useBulkOperations()

  const ignored = isIgnored(asset.path)

  const handleToggleIgnore = useCallback(() => {
    toggleIgnored(asset.path)
    toast.success(ignored ? 'Asset unmarked as ignored' : 'Asset marked as ignored')
  }, [asset.path, ignored, toggleIgnored])

  const handleDelete = useCallback(async () => {
    try {
      return await bulkDelete([asset])
    } catch (err) {
      toast.error('Failed to delete asset')
      console.error('Delete error:', err)
      return false
    }
  }, [asset, bulkDelete])

  return { handleDelete, handleToggleIgnore, ignored, isDeleting }
}
