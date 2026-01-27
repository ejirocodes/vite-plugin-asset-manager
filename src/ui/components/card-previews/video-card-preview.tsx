import { memo, useRef, useState, useEffect, useCallback } from 'react'
import { PlayIcon } from '@phosphor-icons/react'
import { FileIcon } from '../file-icon'
import type { Asset } from '@/ui/types'

interface VideoCardPreviewProps {
  asset: Asset
}

export const VideoCardPreview = memo(function VideoCardPreview({ asset }: VideoCardPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`

  const handleError = useCallback(() => setError(true), [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVisible) {
      video.play().catch(() => {
        // Autoplay might be blocked, that's fine
      })
    } else {
      video.pause()
    }
  }, [isVisible])

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-card">
        <FileIcon extension={asset.extension} className="w-16 h-16" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <video
        ref={videoRef}
        src={isVisible ? fileUrl : undefined}
        muted
        loop
        playsInline
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
