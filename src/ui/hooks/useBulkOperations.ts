import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getApiBase } from '@/ui/lib/api-base'
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
      const response = await fetch(`${getApiBase()}/api/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Delete failed')
      }

      const result = (await response.json()) as {
        deleted: number
        failed: number
        errors: string[]
      }

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
