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
import { useAssetActions } from '@/ui/hooks/useAssetActions'
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
  const actions = useAssetActions({ asset, onPreview })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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
    await actions.handleDelete()
    setDeleteDialogOpen(false)
  }, [actions])

  return (
    <ContextMenu>
      <ContextMenuTrigger onContextMenu={handleContextMenu}>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={actions.handlePreview}>
          <EyeIcon weight="bold" className="w-4 h-4 mr-2" />
          Open Preview
        </ContextMenuItem>

        <ContextMenuItem onClick={actions.handleCopyPath}>
          <CopySimpleIcon weight="bold" className="w-4 h-4 mr-2" />
          Copy Path
          {actions.copyPathState === 'copied' && (
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
            <ContextMenuItem onClick={() => actions.handleCopyImportCode('html')}>
              <FileHtmlIcon weight="bold" className="w-4 h-4 mr-2" />
              HTML
              {actions.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => actions.handleCopyImportCode('react')}>
              <FramerLogoIcon weight="bold" className="w-4 h-4 mr-2" />
              React
              {actions.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => actions.handleCopyImportCode('vue')}>
              <FileVueIcon weight="bold" className="w-4 h-4 mr-2" />
              Vue
              {actions.copyCodeState === 'copied' && (
                <CheckIcon weight="bold" className="w-3 h-3 ml-auto text-emerald-500" />
              )}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={actions.handleOpenInEditor} disabled={!actions.hasImporters}>
          <CodeBlockIcon weight="bold" className="w-4 h-4 mr-2" />
          Open in Editor
          {actions.hasImporters && (
            <span className="ml-auto text-[10px] text-muted-foreground">⌘O</span>
          )}
        </ContextMenuItem>

        <ContextMenuItem onClick={actions.handleRevealInFinder}>
          <FolderOpenIcon weight="bold" className="w-4 h-4 mr-2" />
          Reveal in {isMac ? 'Finder' : 'Explorer'}
          <span className="ml-auto text-[10px] text-muted-foreground">⌘⇧R</span>
        </ContextMenuItem>

        {asset.importersCount === 0 && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={actions.handleToggleIgnore}>
              {actions.ignored ? (
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
          disabled={actions.isDeleting}
        >
          <TrashIcon weight="bold" className="w-4 h-4 mr-2" />
          {actions.isDeleting ? 'Deleting...' : 'Delete'}
          <span className="ml-auto text-[10px]">⌫</span>
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
              {actions.isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  )
})
