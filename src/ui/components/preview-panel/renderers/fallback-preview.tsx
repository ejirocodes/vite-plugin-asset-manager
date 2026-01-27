import { memo } from 'react'
import { FileIcon } from '@/ui/components/file-icon'
import type { Asset } from '@/ui/types'

interface FallbackPreviewProps {
  asset: Asset
}

export const FallbackPreview = memo(function FallbackPreview({ asset }: FallbackPreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-muted/30 rounded-lg">
      <FileIcon extension={asset.extension} className="w-20 h-20" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground mb-1">{asset.name}</p>
        <p className="text-xs text-muted-foreground">
          Download to preview this file type
        </p>
      </div>
    </div>
  )
})
