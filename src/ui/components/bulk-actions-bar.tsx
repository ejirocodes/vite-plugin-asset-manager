import { memo, useCallback, useState } from 'react'
import {
  DownloadSimpleIcon,
  CopyIcon,
  TrashIcon,
  XIcon,
  CheckSquareIcon,
  SquareIcon
} from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/ui/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { Asset } from '../types'

interface BulkActionsBarProps {
  selectedCount: number
  totalCount: number
  selectedAssets: Asset[]
  onSelectAll: () => void
  onDeselectAll: () => void
  onDelete: () => Promise<void>
  isDeleting: boolean
  visible: boolean
}

export const BulkActionsBar = memo(function BulkActionsBar({
  selectedCount,
  totalCount,
  selectedAssets,
  onSelectAll,
  onDeselectAll,
  onDelete,
  isDeleting,
  visible
}: BulkActionsBarProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleCopyPaths = useCallback(async () => {
    const paths = selectedAssets.map(a => a.path).join('\n')
    try {
      await navigator.clipboard.writeText(paths)
      toast.success(`Copied ${selectedCount} path${selectedCount > 1 ? 's' : ''} to clipboard`)
    } catch {
      toast.error('Failed to copy paths to clipboard')
    }
  }, [selectedAssets, selectedCount])

  const handleBulkDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const paths = selectedAssets.map(a => a.path)
      const response = await fetch('/__asset_manager__/api/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      })

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `assets-${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Downloaded ${selectedCount} asset${selectedCount > 1 ? 's' : ''} as ZIP`)
    } catch {
      toast.error('Failed to download assets')
    } finally {
      setIsDownloading(false)
    }
  }, [selectedAssets, selectedCount])

  const handleDeleteConfirm = useCallback(async () => {
    await onDelete()
    setDeleteDialogOpen(false)
  }, [onDelete])

  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div
      className={`sticky top-0 md:top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-3 sm:px-4 flex items-center justify-between transition-all duration-300 ease-out ${
        visible
          ? 'h-14 sm:h-13 py-2 sm:py-3 opacity-100 translate-y-0'
          : 'h-0 py-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          title={allSelected ? 'Deselect all' : 'Select all'}
        >
          {allSelected ? (
            <CheckSquareIcon weight="fill" className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          ) : (
            <SquareIcon weight="regular" className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
        <span className="text-xs sm:text-sm font-medium">{selectedCount} selected</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="text-muted-foreground hidden sm:flex"
        >
          <XIcon weight="bold" className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyPaths}
          disabled={selectedCount === 0}
          className="hidden sm:flex"
        >
          <CopyIcon weight="bold" className="w-4 h-4 mr-1.5" />
          Copy Paths
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleCopyPaths}
          disabled={selectedCount === 0}
          className="sm:hidden"
          title="Copy paths"
        >
          <CopyIcon weight="bold" className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDownload}
          disabled={selectedCount === 0 || isDownloading}
          className="hidden sm:flex"
        >
          <DownloadSimpleIcon weight="bold" className="w-4 h-4 mr-1.5" />
          {isDownloading ? 'Downloading...' : 'Download ZIP'}
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleBulkDownload}
          disabled={selectedCount === 0 || isDownloading}
          className="sm:hidden"
          title="Download ZIP"
        >
          <DownloadSimpleIcon weight="bold" className="w-4 h-4" />
        </Button>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedCount === 0 || isDeleting}
                className="hidden sm:flex"
              >
                <TrashIcon weight="bold" className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            }
          />
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                size="icon-sm"
                disabled={selectedCount === 0 || isDeleting}
                className="sm:hidden"
                title="Delete"
              >
                <TrashIcon weight="bold" className="w-4 h-4" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedCount} asset{selectedCount > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The following files will be permanently deleted from
                your computer:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="max-h-32 overflow-y-auto text-xs font-mono bg-muted/50 rounded p-2 space-y-0.5">
              {selectedAssets.slice(0, 10).map(a => (
                <li key={a.id} className="truncate text-muted-foreground">
                  {a.path}
                </li>
              ))}
              {selectedAssets.length > 10 && (
                <li className="text-muted-foreground/60">
                  ...and {selectedAssets.length - 10} more
                </li>
              )}
            </ul>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
})
