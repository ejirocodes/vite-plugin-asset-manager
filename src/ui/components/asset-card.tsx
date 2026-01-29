import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { FileIcon, getFileTypeColor } from './file-icon'
import { VideoCardPreview, FontCardPreview } from './card-previews'
import { AssetContextMenu } from './asset-context-menu'
import { CopyIcon, CheckIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { Checkbox } from '@/ui/components/ui/checkbox'
import { useIgnoredAssets } from '../providers/ignored-assets-provider'
import type { Asset } from '../types'

interface AssetCardProps {
  asset: Asset
  index?: number
  onPreview?: (asset: Asset) => void
  isSelected?: boolean
  isFocused?: boolean
  onToggleSelect?: (assetId: string, shiftKey: boolean) => void
}

// Module-level cache for formatBytes to prevent recalculation
// Vercel best practice: js-cache-function-results
const formatBytesCache = new Map<number, string>()
function formatBytes(bytes: number): string {
  // Early return with cache lookup - Vercel best practice: js-early-exit
  const cached = formatBytesCache.get(bytes)
  if (cached) return cached

  if (bytes === 0) {
    formatBytesCache.set(0, '0 B')
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const result = parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  formatBytesCache.set(bytes, result)
  return result
}

export const AssetCard = memo(function AssetCard({
  asset,
  index = 0,
  onPreview,
  isSelected = false,
  isFocused = false,
  onToggleSelect
}: AssetCardProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { isIgnored } = useIgnoredAssets()
  const ignored = isIgnored(asset.path)
  const cardRef = useRef<HTMLDivElement>(null)

  // Scroll focused card into view
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }, [isFocused])

  const isImage = asset.type === 'image'
  const thumbnailUrl = `/__asset_manager__/api/thumbnail?path=${encodeURIComponent(asset.path)}`

  const handleClick = useCallback(() => {
    onPreview?.(asset)
  }, [asset, onPreview])

  const handleCheckboxChange = useCallback(
    (checked: boolean, eventDetails: { event: Event }) => {
      const mouseEvent = eventDetails.event as MouseEvent
      onToggleSelect?.(asset.id, mouseEvent.shiftKey ?? false)
    },
    [asset.id, onToggleSelect]
  )

  const handleCopyPath = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(asset.path)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy path:', err)
      }
    },
    [asset.path]
  )

  const handleImageError = useCallback(() => setImageError(true), [])

  const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`
  const extColor = getFileTypeColor(asset.extension)

  return (
    <AssetContextMenu
      asset={asset}
      onPreview={onPreview}
      isSelected={isSelected}
      onToggleSelect={onToggleSelect}
      autoSelect={true}
    >
      <div
        ref={cardRef}
        onClick={handleClick}
        role="gridcell"
        tabIndex={isFocused ? 0 : -1}
        aria-selected={isSelected}
        className={`
          group relative rounded-xl overflow-hidden cursor-pointer
          bg-card border border-border
          hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
          transition-all duration-200 ease-out
          hover-lift animate-fade-in-up opacity-0 ${staggerClass}
          ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
          ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}
          ${isFocused && isSelected ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-background shadow-[0_0_0_4px_hsl(var(--primary))]' : ''}
        `}
      >
        {onToggleSelect && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity duration-150 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} />
          </div>
        )}

        <div className="aspect-square relative overflow-hidden">
          <div className="absolute inset-0 checkerboard" />

          {isImage && !imageError ? (
            <img
              src={thumbnailUrl}
              alt={asset.name}
              className="relative w-full h-full object-cover"
              loading="lazy"
              onError={handleImageError}
            />
          ) : asset.type === 'video' ? (
            <VideoCardPreview asset={asset} />
          ) : asset.type === 'font' ? (
            <FontCardPreview asset={asset} />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-card">
              <FileIcon extension={asset.extension} className="w-16 h-16" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <button
              onClick={handleCopyPath}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy path"
              aria-label="Copy file path"
            >
              {copied ? (
                <CheckIcon weight="bold" className="w-4 h-4 text-emerald-400" />
              ) : (
                <CopyIcon weight="bold" className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <p className="text-sm font-medium text-foreground truncate mb-1" title={asset.name}>
            {asset.name}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-hide pr-2">
              <span
                className={`text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${extColor} bg-current/10 flex-shrink-0`}
                style={{ color: 'inherit' }}
              >
                <span className={extColor}>{asset.extension.replace('.', '')}</span>
              </span>
              {asset.importersCount === 0 && !ignored && (
                <span
                  className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0"
                  aria-label="This asset is not imported by any source files"
                  title="This asset is not imported by any source files"
                >
                  UNUSED
                </span>
              )}
              {asset.importersCount === 0 && ignored && (
                <span
                  className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground border border-border flex-shrink-0"
                  aria-label="This asset is marked as intentionally unused"
                  title="Marked as intentionally unused"
                >
                  <EyeSlashIcon weight="fill" className="w-3 h-3" />
                  IGNORED
                </span>
              )}
              {(asset.duplicatesCount ?? 0) > 0 && (
                <span
                  className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0"
                  aria-label={`This asset has ${asset.duplicatesCount} duplicate${asset.duplicatesCount === 1 ? '' : 's'}`}
                  title={`${asset.duplicatesCount} duplicate file${asset.duplicatesCount === 1 ? '' : 's'} found`}
                >
                  <CopyIcon weight="fill" className="w-3 h-3" />
                  {asset.duplicatesCount} DUPE{asset.duplicatesCount === 1 ? '' : 'S'}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono tabular-nums flex-shrink-0">
              {formatBytes(asset.size)}
            </span>
          </div>
        </div>
      </div>
    </AssetContextMenu>
  )
})
