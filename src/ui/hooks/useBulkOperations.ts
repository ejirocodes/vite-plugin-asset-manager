import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getTransport } from '@/ui/lib/transport'
import type { Asset } from '../types'

interface UseBulkOperationsResult {
  isDeleting: boolean
  bulkDelete: (assets: Asset[]) => Promise<boolean>
}

export function useBulkOperations(): UseBulkOperationsResult {
  const [isDeleting, setIsDeleting] = useState(false)

  const bulkDelete = useCallback(async (assets: Asset[]): Promise<boolean> => {
    setIsDeleting(true)
    try {
      const paths = assets.map(a => a.path)
      const result = await getTransport().bulkDelete(paths)

      if (result.deleted > 0) {
        toast.success(`Deleted ${result.deleted} asset${result.deleted > 1 ? 's' : ''}`)
      }

      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} asset${result.failed > 1 ? 's' : ''}`)
      }

      return result.deleted > 0
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete assets')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { isDeleting, bulkDelete }
}
