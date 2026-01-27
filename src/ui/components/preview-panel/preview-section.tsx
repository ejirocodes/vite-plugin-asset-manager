import { memo } from 'react'
import type { Asset } from '@/ui/types'
import { ImagePreview } from './renderers/image-preview'
import { VideoPreview } from './renderers/video-preview'
import { AudioPreview } from './renderers/audio-preview'
import { CodePreview } from './renderers/code-preview'
import { FontPreview } from './renderers/font-preview'
import { FallbackPreview } from './renderers/fallback-preview'

interface PreviewSectionProps {
  asset: Asset
  onDimensionsLoad?: (dimensions: { width: number; height: number }) => void
}

export const PreviewSection = memo(function PreviewSection({
  asset,
  onDimensionsLoad
}: PreviewSectionProps) {
  const renderPreview = () => {
    switch (asset.type) {
      case 'image':
        return <ImagePreview asset={asset} onDimensionsLoad={onDimensionsLoad} />
      case 'video':
        return <VideoPreview asset={asset} />
      case 'audio':
        return <AudioPreview asset={asset} />
      case 'data':
      case 'text':
        return <CodePreview asset={asset} />
      case 'font':
        return <FontPreview asset={asset} />
      case 'document':
        if (asset.extension === '.pdf') {
          const fileUrl = `/__asset_manager__/api/file?path=${encodeURIComponent(asset.path)}`
          return (
            <iframe
              src={fileUrl}
              className="w-full aspect-[3/4] rounded-lg border border-border"
              title={asset.name}
            />
          )
        }
        return <FallbackPreview asset={asset} />
      default:
        return <FallbackPreview asset={asset} />
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3">Preview</h3>
      {renderPreview()}
    </div>
  )
})
