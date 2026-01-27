import { memo, useState, useCallback } from 'react'
import type { Asset } from '@/ui/types'

interface VideoPreviewProps {
  asset: Asset
}

export const VideoPreview = memo(function VideoPreview({ asset }: VideoPreviewProps) {
  const [error, setError] = useState(false)
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`
  const thumbnailUrl = `/__asset_manager__/api/thumbnail?path=${encodeURIComponent(asset.path)}`

  const handleError = useCallback(() => setError(true), [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Failed to load video
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={fileUrl}
        poster={thumbnailUrl}
        controls
        className="w-full h-full object-contain"
        onError={handleError}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
})
