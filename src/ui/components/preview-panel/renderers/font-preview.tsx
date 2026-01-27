import { memo, useState, useEffect, useId } from 'react'
import type { Asset } from '@/ui/types'

interface FontPreviewProps {
  asset: Asset
}

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog'
const SIZES = [14, 18, 24, 32, 48]

export const FontPreview = memo(function FontPreview({ asset }: FontPreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const fontId = useId()
  const fontFamily = `preview-font-${fontId.replace(/:/g, '-')}`
  const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`

  useEffect(() => {
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
  }, [fileUrl, fontFamily])

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Failed to load font
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        Loading font...
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {SIZES.map(size => (
        <div key={size} className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-mono">{size}px</span>
          <p
            style={{ fontFamily, fontSize: size }}
            className="text-foreground leading-tight truncate"
          >
            {SAMPLE_TEXT}
          </p>
        </div>
      ))}
      <div className="pt-4 border-t border-border">
        <span className="text-[10px] text-muted-foreground font-mono mb-2 block">Characters</span>
        <p style={{ fontFamily }} className="text-lg text-foreground leading-relaxed">
          ABCDEFGHIJKLMNOPQRSTUVWXYZ
        </p>
        <p style={{ fontFamily }} className="text-lg text-foreground leading-relaxed">
          abcdefghijklmnopqrstuvwxyz
        </p>
        <p style={{ fontFamily }} className="text-lg text-foreground leading-relaxed">
          0123456789 !@#$%^&*()
        </p>
      </div>
    </div>
  )
})
