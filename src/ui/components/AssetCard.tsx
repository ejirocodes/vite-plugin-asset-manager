import { FileIcon } from './FileIcon'
import type { Asset } from '../types'

interface AssetCardProps {
  asset: Asset
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function AssetCard({ asset }: AssetCardProps) {
  const isImage = asset.type === 'image'
  const thumbnailUrl = `/__asset-manager/api/thumbnail?path=${encodeURIComponent(asset.path)}`
  const fileUrl = `/__asset-manager/api/file?path=${encodeURIComponent(asset.path)}`

  const handleClick = () => {
    window.open(fileUrl, '_blank')
  }

  return (
    <div
      onClick={handleClick}
      className="group relative bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
    >
      <div className="aspect-square flex items-center justify-center bg-slate-900">
        {isImage ? (
          <img
            src={thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={isImage ? 'hidden' : ''}>
          <FileIcon extension={asset.extension} className="w-12 h-12 text-slate-400" />
        </div>
      </div>
      <div className="p-2">
        <p className="text-sm text-slate-200 truncate" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-slate-500">{formatBytes(asset.size)}</p>
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs bg-blue-500 px-2 py-1 rounded">Open</span>
      </div>
    </div>
  )
}
