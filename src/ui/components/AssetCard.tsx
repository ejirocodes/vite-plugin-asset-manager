import { useState } from 'react'
import { FileIcon, getFileTypeColor } from './FileIcon'
import { CopyIcon, CheckIcon, ArrowSquareOutIcon } from '@phosphor-icons/react'
import type { Asset } from '../types'

interface AssetCardProps {
  asset: Asset
  index?: number
  onPreview?: (asset: Asset) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function AssetCard({ asset, index = 0, onPreview }: AssetCardProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isImage = asset.type === 'image'
  const thumbnailUrl = `/__asset-manager/api/thumbnail?path=${encodeURIComponent(asset.path)}`
  const fileUrl = `/__asset-manager/api/file?path=${encodeURIComponent(asset.path)}`

  const handleClick = () => {
    if (onPreview) {
      onPreview(asset)
    } else {
      window.open(fileUrl, '_blank')
    }
  }

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(asset.path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy path:', err)
    }
  }

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(fileUrl, '_blank')
  }

  const staggerClass = `stagger-${Math.min((index % 8) + 1, 8)}`
  const extColor = getFileTypeColor(asset.extension)

  return (
    <div
      onClick={handleClick}
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer
        bg-card border border-border
        hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
        transition-all duration-200 ease-out
        hover-lift animate-fade-in-up opacity-0 ${staggerClass}
      `}
    >
      <div className="aspect-square relative overflow-hidden">
        <div className="absolute inset-0 checkerboard" />

        {isImage && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={asset.name}
            className="relative w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-card">
            <FileIcon extension={asset.extension} className="w-16 h-16" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          <button
            onClick={handleCopyPath}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Copy path"
          >
            {copied ? (
              <CheckIcon weight="bold" className="w-4 h-4 text-emerald-400" />
            ) : (
              <CopyIcon weight="bold" className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Open in new tab"
          >
            <ArrowSquareOutIcon weight="bold" className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <p
          className="text-sm font-medium text-foreground truncate mb-1"
          title={asset.name}
        >
          {asset.name}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${extColor} bg-current/10`}
            style={{ color: 'inherit' }}
          >
            <span className={extColor}>
              {asset.extension.replace('.', '')}
            </span>
          </span>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {formatBytes(asset.size)}
          </span>
        </div>
      </div>
    </div>
  )
}
