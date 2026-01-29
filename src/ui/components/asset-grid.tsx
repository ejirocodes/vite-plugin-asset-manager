import { memo, useEffect, RefObject, useCallback } from 'react'
import { AssetCard } from './asset-card'
import { useVirtualGrid } from '../hooks/useVirtualGrid'
import { useResponsiveColumns } from '../hooks/useResponsiveColumns'
import type { Asset } from '../types'

interface AssetGridProps {
  assets: Asset[]
  scrollContainerRef: RefObject<HTMLElement | null>
  onPreview?: (asset: Asset) => void
  selectedAssets?: Set<string>
  focusedAssetId?: string | null
  onToggleSelect?: (assetId: string, shiftKey: boolean) => void
}

const ROW_HEIGHT = 200
const GAP = 12
const MIN_CARD_WIDTH = 180

export const AssetGrid = memo(function AssetGrid({
  assets,
  scrollContainerRef,
  onPreview,
  selectedAssets,
  focusedAssetId,
  onToggleSelect
}: AssetGridProps) {
  const columns = useResponsiveColumns(scrollContainerRef)

  const { virtualRows, totalHeight, getRowItems, scrollToItem } = useVirtualGrid({
    items: assets,
    columns,
    scrollElement: scrollContainerRef,
    rowHeight: ROW_HEIGHT + 25,
    gap: GAP,
    overscan: 2
  })

  useEffect(() => {
    if (focusedAssetId) {
      const index = assets.findIndex(a => a.id === focusedAssetId)
      if (index !== -1) scrollToItem(index)
    }
  }, [focusedAssetId, assets, scrollToItem])

  const getItemIndex = useCallback(
    (rowIndex: number, colIndex: number) => rowIndex * columns + colIndex,
    [columns]
  )

  if (assets.length === 0) return null

  return (
    <div role="grid" aria-multiselectable="true" className="px-4 pt-4 pb-8">
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualRows.map(virtualRow => {
          const rowItems = getRowItems(virtualRow.index)
          return (
            <div
              key={virtualRow.key}
              role="row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(${MIN_CARD_WIDTH}px, 1fr))`,
                gap: GAP
              }}
            >
              {rowItems.map((asset, colIndex) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  index={getItemIndex(virtualRow.index, colIndex)}
                  onPreview={onPreview}
                  isSelected={selectedAssets?.has(asset.id)}
                  isFocused={asset.id === focusedAssetId}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
})
