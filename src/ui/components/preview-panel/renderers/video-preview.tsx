import { memo, useState, useCallback } from 'react'
import { DownloadIcon, WarningIcon } from '@phosphor-icons/react'
import type { Asset } from '@/ui/types'
import { Button } from '@/ui/components/ui/button'

interface VideoPreviewProps {
  asset: Asset
}

export const VideoPreview = memo(function VideoPreview({ asset }: VideoPreviewProps) {
  const [error, setError] = useState(false)
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`
  const thumbnailUrl = `/__asset_manager__/api/thumbnail?path=${encodeURIComponent(asset.path)}`
  const extension = asset.path.split('.').pop()?.toUpperCase() || 'VIDEO'

  const handleError = useCallback(() => setError(true), [])

  const handleDownload = useCallback(() => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = asset.name
    link.click()
  }, [fileUrl, asset.name])

  if (error) {
    const isAVI = extension === 'AVI'
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <WarningIcon className="w-12 h-12 text-yellow-500" weight="duotone" />
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Unable to play video</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {isAVI ? (
              <>
                This AVI file uses a codec that isn't supported by your browser. Most AVI files
                use legacy codecs (DivX, Xvid) that HTML5 video can't play.
              </>
            ) : (
              <>
                This {extension} video format or codec isn't supported by your browser's HTML5
                video player.
              </>
            )}
          </p>
          {isAVI && (
            <p className="text-xs text-muted-foreground max-w-md pt-2">
              💡 Tip: Convert to MP4 (H.264) or WebM for browser compatibility
            </p>
          )}
        </div>
        <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
          <DownloadIcon className="w-4 h-4" />
          Download Video
        </Button>
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
