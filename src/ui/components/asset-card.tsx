import { useState, useRef, memo, useCallback } from 'react'
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
        setTimeout(() => setCopied(false), 1500)
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
          group relative cursor-pointer
          bg-zinc-900/50 rounded-lg overflow-hidden
          border border-zinc-800/80
          transition-all duration-150 ease-out
          hover:bg-zinc-900/80 hover:border-zinc-700/80
          animate-fade-in-up opacity-0 ${staggerClass}
          ${isSelected ? 'ring-1 ring-violet-500/70 border-violet-500/50 bg-violet-500/5' : ''}
          ${isFocused ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-950' : ''}
        `}
      >
        {onToggleSelect && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity duration-100 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              className="border-zinc-600 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
            />
          </div>
        )}

        <div className="relative h-45 bg-zinc-950/50">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
                               linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%),
                               linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.02) 75%),
                               linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.02) 75%)`,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
          />

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

          <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center backdrop-blur-[2px]">
            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-xs text-zinc-300 hover:text-white"
              title="Copy path"
              aria-label="Copy file path"
            >
              {copied ? (
                <>
                  <CheckIcon weight="bold" className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon weight="bold" className="w-3.5 h-3.5" />
                  <span>Copy path</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-3 py-2.5 border-t border-zinc-800/50">
          <p
            className="text-[13px] font-medium text-zinc-200 truncate leading-tight"
            title={asset.name}
          >
            {asset.name}
          </p>

          <div className="flex items-center justify-between gap-2 mt-1.5">
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span
                className={`text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm ${extColor} bg-current/10 shrink-0`}
              >
                <span className={extColor}>{asset.extension.replace('.', '')}</span>
              </span>

              {asset.importersCount === 0 && !ignored && (
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-500 shrink-0">
                  unused
                </span>
              )}
              {asset.importersCount === 0 && ignored && (
                <span className="flex items-center gap-0.5 text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-500 shrink-0">
                  <EyeSlashIcon weight="fill" className="w-2.5 h-2.5" />
                  ignored
                </span>
              )}
              {(asset.duplicatesCount ?? 0) > 0 && (
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 shrink-0">
                  {asset.duplicatesCount} dupe{asset.duplicatesCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            <span className="text-[11px] text-zinc-500 font-mono tabular-nums shrink-0">
              {formatBytes(asset.size)}
            </span>
          </div>
        </div>
      </div>
    </AssetContextMenu>
  )
})
