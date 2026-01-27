import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import { Separator } from '@/ui/components/ui/separator'
import { PreviewSection } from './preview-section'
import { DetailsSection } from './details-section'
import { ActionsSection } from './actions-section'
import { CodeSnippets } from './code-snippets'
import type { Asset } from '@/ui/types'

interface PreviewPanelProps {
  asset: Asset
  onClose: () => void
}

export const PreviewPanel = memo(function PreviewPanel({ asset, onClose }: PreviewPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    setImageDimensions(null)
  }, [asset.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  const handleDimensionsLoad = useCallback((dimensions: { width: number; height: number }) => {
    setImageDimensions(dimensions)
  }, [])

  return (
    <aside
      role="region"
      aria-label={`Preview of ${asset.name}`}
      className="w-96 h-screen border-l border-border bg-card/80 backdrop-blur-sm flex flex-col overflow-hidden animate-slide-in-right"
    >
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground truncate pr-2" title={asset.name}>
          {asset.name}
        </h2>
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close preview panel"
          className="shrink-0"
        >
          <XIcon weight="bold" className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PreviewSection asset={asset} onDimensionsLoad={handleDimensionsLoad} />
        <Separator />
        <DetailsSection asset={asset} imageDimensions={imageDimensions} />
        <Separator />
        <ActionsSection asset={asset} />
        <Separator />
        <CodeSnippets asset={asset} />
      </div>
    </aside>
  )
})
