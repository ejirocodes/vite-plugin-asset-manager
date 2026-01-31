import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { Button } from '@/ui/components/ui/button'
import { Separator } from '@/ui/components/ui/separator'
import { PreviewSection } from './preview-section'
import { DetailsSection } from './details-section'
import { ImportersSection } from './importers-section'
import { DuplicatesSection } from './duplicates-section'
import { ActionsSection } from './actions-section'
import { CodeSnippets } from './code-snippets'
import type { Asset } from '@/ui/types'

interface PreviewPanelProps {
  asset: Asset
  onClose: () => void
  onSelectAsset?: (asset: Asset) => void
  flatAssetList?: Asset[]
  onAssetChange?: (asset: Asset) => void
}

const MIN_WIDTH = 300
const MAX_WIDTH = 600
const DEFAULT_WIDTH = 384

export const PreviewPanel = memo(function PreviewPanel({
  asset,
  onClose,
  onSelectAsset,
  flatAssetList = [],
  onAssetChange
}: PreviewPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [dimensionsState, setDimensionsState] = useState<{
    assetId: string
    dimensions: { width: number; height: number } | null
  }>({ assetId: asset.id, dimensions: null })
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  const imageDimensions = dimensionsState.assetId === asset.id ? dimensionsState.dimensions : null

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
    if (!flatAssetList.length || !onAssetChange) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (isInputField) return

      const currentIndex = flatAssetList.findIndex(a => a.id === asset.id)
      if (currentIndex === -1) return

      if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault()
        const nextIndex = Math.min(currentIndex + 1, flatAssetList.length - 1)
        if (nextIndex !== currentIndex) {
          onAssetChange(flatAssetList[nextIndex])
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        if (prevIndex !== currentIndex) {
          onAssetChange(flatAssetList[prevIndex])
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [asset.id, flatAssetList, onAssetChange])

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  const handleDimensionsLoad = useCallback(
    (dimensions: { width: number; height: number }) => {
      setDimensionsState({ assetId: asset.id, dimensions })
    },
    [asset.id]
  )

  return (
    <aside
      role="region"
      aria-label={`Preview of ${asset.name}`}
      style={{
        width: typeof window !== 'undefined' && window.innerWidth >= 768 ? panelWidth : undefined
      }}
      className="fixed top-0 right-0 z-50 h-screen md:h-screen border-l border-border bg-card/80 backdrop-blur-sm flex flex-col overflow-hidden animate-slide-in-right
        max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[85vh] max-md:w-full! max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t"
    >
      {/* Desktop resize handle - hidden on mobile */}
      <div
        onMouseDown={handleResizeStart}
        className={`absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary/70 transition-colors z-10 max-md:hidden ${
          isResizing ? 'bg-primary/70' : ''
        }`}
        aria-hidden="true"
      />

      {/* Mobile drag indicator */}
      <div className="md:hidden flex justify-center pt-2 pb-1" aria-hidden="true">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground truncate pr-2 max-w-[80%]" title={asset.name}>
          {asset.name}
        </h2>
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close preview panel"
          className="shrink-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0"
        >
          <XIcon weight="bold" className="w-5 h-5 md:w-4 md:h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <PreviewSection asset={asset} onDimensionsLoad={handleDimensionsLoad} />
        <Separator />
        <DetailsSection asset={asset} imageDimensions={imageDimensions} />
        <Separator />
        <ImportersSection asset={asset} />
        {(asset.duplicatesCount ?? 0) > 0 && (
          <>
            <Separator />
            <DuplicatesSection asset={asset} onSelectAsset={onSelectAsset} />
          </>
        )}
        <Separator />
        <ActionsSection asset={asset} />
        <Separator />
        <CodeSnippets asset={asset} />
      </div>
    </aside>
  )
})
