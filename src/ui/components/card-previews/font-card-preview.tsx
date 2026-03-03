import { memo, useState, useEffect, useId } from 'react'
import { FileIcon } from '../file-icon'
import { getTransport } from '@/ui/lib/transport'
import type { Asset } from '@/ui/types'

interface FontCardPreviewProps {
  asset: Asset
}

export const FontCardPreview = memo(function FontCardPreview({ asset }: FontCardPreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fontId = useId()
  const fontFamily = `card-font-${fontId.replace(/:/g, '-')}`
  const fileUrl = getTransport().getFileUrl(asset.path)

  useEffect(() => {
    let cancelled = false
    const font = new FontFace(fontFamily, `url(${fileUrl})`)

    font.load().then(() => {
      if (cancelled) return
      document.fonts.add(font)
      setLoaded(true)
    }).catch(err => {
      if (cancelled) return
      console.error('Failed to load font:', err)
      setError(true)
    })

    return () => {
      cancelled = true
      document.fonts.delete(font)
    }
  }, [fileUrl, fontFamily])

  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-card">
        <FileIcon extension={asset.extension} className="w-16 h-16" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-card">
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
