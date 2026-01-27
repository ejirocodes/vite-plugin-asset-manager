import { memo, useState, useCallback } from 'react'
import type { Asset } from '@/ui/types'

interface ImagePreviewProps {
  asset: Asset
  onDimensionsLoad?: (dimensions: { width: number; height: number }) => void
}

export const ImagePreview = memo(function ImagePreview({ asset, onDimensionsLoad }: ImagePreviewProps) {
  const [error, setError] = useState(false)
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    onDimensionsLoad?.({ width: img.naturalWidth, height: img.naturalHeight })
  }, [onDimensionsLoad])

  const handleError = useCallback(() => setError(true), [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Failed to load image
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-square overflow-hidden">
      <div className="absolute inset-0 checkerboard" />
      <img
        src={fileUrl}
        alt={asset.name}
        className="relative w-full h-full object-contain"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
})
