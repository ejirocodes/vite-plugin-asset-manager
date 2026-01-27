import { memo, useState, useCallback } from 'react'
import { MusicNoteIcon } from '@phosphor-icons/react'
import type { Asset } from '@/ui/types'

interface AudioPreviewProps {
  asset: Asset
}

export const AudioPreview = memo(function AudioPreview({ asset }: AudioPreviewProps) {
  const [error, setError] = useState(false)
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`

  const handleError = useCallback(() => setError(true), [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Failed to load audio
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 bg-muted/30 rounded-lg">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <MusicNoteIcon weight="duotone" className="w-10 h-10 text-primary" />
      </div>
      <audio
        src={fileUrl}
        controls
        className="w-full max-w-[280px]"
        onError={handleError}
        preload="metadata"
      >
        Your browser does not support the audio tag.
      </audio>
    </div>
  )
})
