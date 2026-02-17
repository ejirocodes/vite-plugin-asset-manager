import { memo, useCallback, useState } from 'react'
import { DownloadIcon, EyeSlashIcon, EyeIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/ui/components/ui/alert-dialog'
import { useAssetMutations } from '@/ui/hooks/useAssetMutations'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset } from '@/ui/types'

interface ActionsSectionProps {
  asset: Asset
}

export const ActionsSection = memo(function ActionsSection({ asset }: ActionsSectionProps) {
  const fileUrl = `${getApiBase()}/api/file?path=${encodeURIComponent(asset.path)}`
  const { isDeleting, handleDelete, handleToggleIgnore, ignored } = useAssetMutations(asset)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = asset.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [fileUrl, asset.name])

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    await handleDelete()
    setDeleteDialogOpen(false)
  }, [handleDelete])

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">Actions</h3>
      <div className="space-y-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="w-full justify-start gap-2"
        >
          <DownloadIcon weight="bold" className="w-4 h-4" />
          Download
        </Button>

        {asset.importersCount === 0 && (
          <Button
            variant={ignored ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleIgnore}
            className="w-full justify-start gap-2"
            title={
              ignored
                ? 'Remove from ignore list - asset will appear in unused filter again'
                : "Mark as intentionally unused - won't appear in unused filter"
            }
          >
            {ignored ? (
              <>
                <EyeIcon weight="bold" className="w-4 h-4" />
                Unmark as Ignored
              </>
            ) : (
              <>
                <EyeSlashIcon weight="bold" className="w-4 h-4" />
                Mark as Ignored
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
        >
          <TrashIcon weight="bold" className="w-4 h-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following file will be permanently deleted from your
              computer:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-xs font-mono bg-muted/50 rounded p-2 text-muted-foreground truncate">
            {asset.path}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
})