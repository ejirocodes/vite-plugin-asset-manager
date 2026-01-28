import { memo } from 'react'
import { CopyIcon, SpinnerGapIcon, FolderIcon } from '@phosphor-icons/react'
import { useDuplicates } from '@/ui/hooks/useDuplicates'
import type { Asset } from '@/ui/types'

interface DuplicatesSectionProps {
  asset: Asset
  onSelectAsset?: (asset: Asset) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const DuplicatesSection = memo(function DuplicatesSection({
  asset,
  onSelectAsset
}: DuplicatesSectionProps) {
  const { duplicates, loading } = useDuplicates(asset.contentHash)

  // Filter out the current asset from the list
  const otherDuplicates = duplicates.filter(d => d.path !== asset.path)

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">
        Duplicates {!loading && `(${otherDuplicates.length})`}
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-2">
          <SpinnerGapIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs">Scanning...</span>
        </div>
      ) : otherDuplicates.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No duplicates found</p>
      ) : (
        <div className="space-y-1">
          {otherDuplicates.map(duplicate => (
            <button
              key={duplicate.id}
              onClick={() => onSelectAsset?.(duplicate)}
              className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CopyIcon weight="bold" className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-medium truncate">{duplicate.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                  {formatBytes(duplicate.size)}
                </span>
              </div>
              <div className="mt-1 pl-5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <FolderIcon weight="fill" className="w-3 h-3" />
                  <span className="truncate">{duplicate.directory}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
