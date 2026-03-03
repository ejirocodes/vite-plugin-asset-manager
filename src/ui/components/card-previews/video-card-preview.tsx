import { memo, useRef, useState, useCallback } from 'react'
import { PlayIcon } from '@phosphor-icons/react'
import { FileIcon } from '../file-icon'
import { getTransport } from '@/ui/lib/transport'
import type { Asset } from '@/ui/types'

interface VideoCardPreviewProps {
  asset: Asset
}

export const VideoCardPreview = memo(function VideoCardPreview({ asset }: VideoCardPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  const fileUrl = getTransport().getFileUrl(asset.path)

  const handleError = useCallback(() => setError(true), [])

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-card">
        <FileIcon extension={asset.extension} className="w-16 h-16" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={fileUrl}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        onError={handleError}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
          <PlayIcon weight="fill" className="w-4 h-4 text-white ml-0.5" />
        </div>
      </div>
    </div>
  )
})
