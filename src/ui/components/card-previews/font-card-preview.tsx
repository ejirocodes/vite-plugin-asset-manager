import { memo, useState, useEffect, useId, useRef } from 'react'
import { FileIcon } from '../file-icon'
import { getApiBase } from '@/ui/lib/api-base'
import type { Asset } from '@/ui/types'

interface FontCardPreviewProps {
  asset: Asset
}

export const FontCardPreview = memo(function FontCardPreview({ asset }: FontCardPreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fontId = useId()
  const fontFamily = `card-font-${fontId.replace(/:/g, '-')}`
  const fileUrl = `${getApiBase()}/api/file?path=${encodeURIComponent(asset.path)}`

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const loadFont = async () => {
      try {
        const font = new FontFace(fontFamily, `url(${fileUrl})`)
        await font.load()
        document.fonts.add(font)
        setLoaded(true)
      } catch (err) {
        console.error('Failed to load font:', err)
        setError(true)
      }
    }

    loadFont()

    return () => {
      document.fonts.forEach(font => {
        if (font.family === fontFamily) {
          document.fonts.delete(font)
        }
      })
    }
  }, [isVisible, fileUrl, fontFamily])

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-card">
        <FileIcon extension={asset.extension} className="w-16 h-16" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-card"
    >
      {loaded ? (
        <span style={{ fontFamily }} className="text-5xl text-foreground select-none">
          Ag
        </span>
      ) : (
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      )}
    </div>
  )
})
