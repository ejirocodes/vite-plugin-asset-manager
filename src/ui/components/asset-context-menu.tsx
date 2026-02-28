import { memo, useCallback, useState, type ReactNode } from 'react'
import {
  EyeIcon,
  CopySimpleIcon,
  CodeIcon,
  FileHtmlIcon,
  FramerLogoIcon,
  FileVueIcon,
  CodeBlockIcon,
  FolderOpenIcon,
  EyeSlashIcon,
  TrashIcon,
  CheckIcon
} from '@phosphor-icons/react'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
  ContextMenuGroup
} from '@/ui/components/ui/context-menu'
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
import { useAssetClipboard } from '@/ui/hooks/useAssetClipboard'
import { useAssetFileActions } from '@/ui/hooks/useAssetFileActions'
import { useAssetMutations } from '@/ui/hooks/useAssetMutations'
import type { Asset } from '../types'

interface AssetContextMenuProps {
  asset: Asset
  children: ReactNode
  onPreview?: (asset: Asset) => void
  isSelected?: boolean
  onToggleSelect?: (assetId: string, shiftKey: boolean) => void
  autoSelect?: boolean
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

export const AssetContextMenu = memo(function AssetContextMenu({
  asset,
  children,
  onPreview,
  isSelected = false,
  onToggleSelect,
  autoSelect = true
}: AssetContextMenuProps) {
  const clipboard = useAssetClipboard(asset)
  const fileActions = useAssetFileActions(asset)
  const mutations = useAssetMutations(asset)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handlePreview = useCallback(() => {
    onPreview?.(asset)
  }, [asset, onPreview])

  const handleContextMenu = useCallback(
    (_e: React.MouseEvent) => {
      if (autoSelect && !isSelected && onToggleSelect) {
        onToggleSelect(asset.id, false)
      }
    },
    [autoSelect, isSelected, onToggleSelect, asset.id]
  )

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    await mutations.handleDelete()
    setDeleteDialogOpen(false)
  }, [mutations])

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu}>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handlePreview}>
          <EyeIcon weight="bold" className="w-4 h-4 mr-2" />
          Open Preview
        </ContextMenuItem>

        <ContextMenuItem onClick={clipboard.handleCopyPath}>
          <CopySimpleIcon weight="bold" className="w-4 h-4 mr-2" />
          Copy Path
          {clipboard.copyPathState === 'copied' && (
            <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CodeIcon weight="bold" className="w-4 h-4 mr-2" />
            Copy Import Code
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => clipboard.handleCopyImportCode('html')}>
              <FileHtmlIcon weight="bold" className="w-4 h-4 mr-2" />
              HTML
              {clipboard.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => clipboard.handleCopyImportCode('react')}>
              <FramerLogoIcon weight="bold" className="w-4 h-4 mr-2" />
              React
              {clipboard.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => clipboard.handleCopyImportCode('vue')}>
              <FileVueIcon weight="bold" className="w-4 h-4 mr-2" />
              Vue
              {clipboard.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={fileActions.handleOpenInEditor} disabled={!fileActions.hasImporters}>
          <CodeBlockIcon weight="bold" className="w-4 h-4 mr-2" />
          Open in Editor
          {fileActions.hasImporters && (
            <span className="ml-auto text-[10px] text-muted-foreground">{isMac ? '⌘O' : 'Ctrl+O'}</span>
          )}
        </ContextMenuItem>

        <ContextMenuItem onClick={fileActions.handleRevealInFinder}>
          <FolderOpenIcon weight="bold" className="w-4 h-4 mr-2" />
          Reveal in {isMac ? 'Finder' : 'Explorer'}
          <span className="ml-auto text-[10px] text-muted-foreground">{isMac ? '⌘⇧R' : 'Ctrl+Shift+R'}</span>
        </ContextMenuItem>

        {asset.importersCount === 0 && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={mutations.handleToggleIgnore}>
              {mutations.ignored ? (
                <>
                  <EyeIcon weight="bold" className="w-4 h-4 mr-2" />
                  Unmark as Ignored
                </>
              ) : (
                <>
                  <EyeSlashIcon weight="bold" className="w-4 h-4 mr-2" />
                  Mark as Ignored
                </>
              )}
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          variant="destructive"
          onClick={handleDeleteClick}
          disabled={mutations.isDeleting}
        >
          <TrashIcon weight="bold" className="w-4 h-4 mr-2" />
          {mutations.isDeleting ? 'Deleting...' : 'Delete'}
          <span className="ml-auto text-[10px]">{isMac ? '⌫' : 'Del'}</span>
        </ContextMenuItem>

        {isSelected && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel className="text-[10px] text-muted-foreground px-2 py-1.5">
                Selected asset
              </ContextMenuLabel>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>

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
              {mutations.isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  )
})
