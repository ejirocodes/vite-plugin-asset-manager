import { memo, useCallback, useState } from 'react'
import { CopyIcon, CheckIcon, ArrowSquareOutIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset } from '@/ui/types'

interface DetailsSectionProps {
  asset: Asset
  imageDimensions?: { width: number; height: number } | null
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)

  let relative = ''
  if (diffDays === 0) {
    relative = 'today'
  } else if (diffDays === 1) {
    relative = 'yesterday'
  } else if (diffDays < 30) {
    relative = `${diffDays} days ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    relative = `${months} ${months === 1 ? 'month' : 'months'} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    relative = `${years} ${years === 1 ? 'year' : 'years'} ago`
  }

  return `${formatted} (${relative})`
}

function getPublicPath(asset: Asset): string {
  if (asset.path.startsWith('public/')) {
    return '/' + asset.path.slice(7)
  }
  return '/' + asset.path
}

function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  const ratioW = width / divisor
  const ratioH = height / divisor

  if (ratioW === ratioH) return '1:1'
  if (ratioW <= 20 && ratioH <= 20) return `${ratioW}:${ratioH}`

  const ratio = width / height
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9'
  if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3'
  if (Math.abs(ratio - 3 / 2) < 0.01) return '3:2'
  if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9'

  return ratio.toFixed(2) + ':1'
}

function getAssetTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

interface DetailRowProps {
  label: string
  value: string
  copyable?: boolean
  externalLink?: string
}

const DetailRow = memo(function DetailRow({
  label,
  value,
  copyable,
  externalLink
}: DetailRowProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (_err) {
      toast.error('Failed to copy')
    }
  }, [value])

  const handleOpenExternal = useCallback(() => {
    if (externalLink) {
      window.open(externalLink, '_blank')
    }
  }, [externalLink])

  return (
    <div className="flex items-start justify-between gap-2 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-foreground font-medium text-right truncate" title={value}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <CheckIcon weight="bold" className="w-3 h-3 text-emerald-500" />
            ) : (
              <CopyIcon weight="bold" className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
        {externalLink && (
          <button
            onClick={handleOpenExternal}
            className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
            aria-label={`Open ${label} externally`}
          >
            <ArrowSquareOutIcon weight="bold" className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  )
})

export const DetailsSection = memo(function DetailsSection({
  asset,
  imageDimensions
}: DetailsSectionProps) {
  const publicPath = getPublicPath(asset)
  const fileUrl = `${getApiBase()}/api/file?path=${encodeURIComponent(asset.path)}`

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">Details</h3>
      <div className="divide-y divide-border">
        <DetailRow label="Filepath" value={asset.absolutePath} copyable externalLink={fileUrl} />
        <DetailRow label="Public Path" value={publicPath} copyable />
        <DetailRow label="Type" value={getAssetTypeLabel(asset.type)} />
        {imageDimensions && (
          <>
            <DetailRow
              label="Image Size"
              value={`${imageDimensions.width} x ${imageDimensions.height}`}
            />
            <DetailRow
              label="Aspect Ratio"
              value={calculateAspectRatio(imageDimensions.width, imageDimensions.height)}
            />
          </>
        )}
        <DetailRow label="File size" value={formatBytes(asset.size)} />
        <DetailRow label="Last modified" value={formatDate(asset.mtime)} />
      </div>
    </div>
  )
})
