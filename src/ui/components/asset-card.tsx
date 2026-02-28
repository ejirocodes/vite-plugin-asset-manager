import { useState, useRef, memo, useCallback } from 'react'
import { FileIcon } from './file-icon'
import { VideoCardPreview, FontCardPreview } from './card-previews'
import { AssetContextMenu } from './asset-context-menu'
import { CopyIcon, CheckIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { Checkbox } from '@/ui/components/ui/checkbox'
import { useIgnoredAssets } from '../providers/ignored-assets-provider'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset } from '../types'

interface AssetCardProps {
  asset: Asset
  index?: number
  onPreview?: (asset: Asset) => void
  isSelected?: boolean
  isFocused?: boolean
  onToggleSelect?: (assetId: string, shiftKey: boolean) => void
}

const formatBytesCache = new Map<number, string>()
function formatBytes(bytes: number): string {
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

  const isImage = asset.type === 'image'
  const thumbnailUrl = `${getApiBase()}/api/thumbnail?path=${encodeURIComponent(asset.path)}`

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
          group relative cursor-pointer
          bg-card/80 rounded-lg overflow-hidden
          border border-border
          transition-[background-color,border-color,box-shadow] duration-150 ease-out
          hover:bg-muted/50 hover:border-border
          animate-fade-in-up opacity-0 ${staggerClass}
          ${isSelected ? 'ring-1 ring-primary/70 border-primary/50 bg-primary/5' : ''}
          ${isFocused ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
        `}
      >
        {onToggleSelect && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity duration-150 ${
              isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary min-h-11 min-w-11 sm:min-h-0 sm:min-w-0"
            />
          </div>
        )}

        <div className="relative h-45 bg-muted/50">
          <div className="absolute inset-0 checkerboard opacity-30" />

          <div className="relative w-full h-full flex items-center justify-center p-3">
            {isImage && !imageError ? (
              <img
                src={thumbnailUrl}
                alt={asset.name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                onError={handleImageError}
              />
            ) : asset.type === 'video' ? (
              <VideoCardPreview asset={asset} />
            ) : asset.type === 'font' ? (
              <FontCardPreview asset={asset} />
            ) : (
              <FileIcon extension={asset.extension} className="w-12 h-12 opacity-60" />
            )}
          </div>

          <button
            onClick={handleCopyPath}
            className={`absolute top-2 right-2 z-10 transition-[opacity,background-color,color] duration-150
              p-2 sm:p-1.5 rounded-md
              bg-background/80 backdrop-blur-sm border border-border/50
              text-muted-foreground hover:text-foreground hover:bg-background
              min-h-11 min-w-11 sm:min-h-0 sm:min-w-0
              flex items-center justify-center
              ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
            `}
            title="Copy path"
            aria-label="Copy file path"
          >
            {copied ? (
              <CheckIcon weight="bold" className="w-3.5 h-3.5 text-status-success" />
            ) : (
              <CopyIcon weight="bold" className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="px-3 py-2.5 border-t border-border/50">
          <p
            className="text-[13px] font-medium text-foreground truncate leading-tight"
            title={asset.name}
          >
            {asset.name}
          </p>

          <div className="flex items-center justify-between gap-2 mt-1.5">
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0">
                {asset.extension.replace('.', '')}
              </span>

              {asset.importersCount === 0 && !ignored && (
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-status-warning/10 text-status-warning shrink-0">
                  unused
                </span>
              )}
              {asset.importersCount === 0 && ignored && (
                <span className="flex items-center gap-0.5 text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground shrink-0">
                  <EyeSlashIcon weight="fill" className="w-2.5 h-2.5" />
                  ignored
                </span>
              )}
              {asset.duplicatesCount > 0 && (
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-status-info/10 text-status-info shrink-0">
                  {asset.duplicatesCount} dupe{asset.duplicatesCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <span className="text-[11px] text-muted-foreground font-mono tabular-nums shrink-0">
              {formatBytes(asset.size)}
            </span>
          </div>
        </div>
      </div>
    </AssetContextMenu>
  )
})
