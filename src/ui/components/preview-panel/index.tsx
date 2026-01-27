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

const MIN_WIDTH = 300
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 384

export const PreviewPanel = memo(function PreviewPanel({ asset, onClose }: PreviewPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(
    null
  )
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    setImageDimensions(null)
  }, [asset.id])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      const startX = e.clientX
      const startWidth = panelWidth

      const handleMouseMove = (e: MouseEvent) => {
        const delta = startX - e.clientX
        const newWidth = Math.min(Math.max(startWidth + delta, MIN_WIDTH), MAX_WIDTH)
        setPanelWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [panelWidth]
  )

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
      style={{ width: panelWidth }}
      className="fixed top-0 right-0 z-50 h-screen border-l border-border bg-card/80 backdrop-blur-sm flex flex-col overflow-hidden animate-slide-in-right"
    >
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary/70 transition-colors z-10 ${
          isResizing ? 'bg-primary/70' : ''
        }`}
        aria-hidden="true"
      />
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
