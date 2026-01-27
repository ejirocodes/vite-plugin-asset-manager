import { memo } from 'react'
import { AssetCard } from './asset-card'
import type { Asset } from '../types'

interface AssetGridProps {
  assets: Asset[]
  onPreview?: (asset: Asset) => void
  selectedAssets?: Set<string>
  onToggleSelect?: (assetId: string, shiftKey: boolean) => void
}

export const AssetGrid = memo(function AssetGrid({
  assets,
  onPreview,
  selectedAssets,
  onToggleSelect
}: AssetGridProps) {
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {assets.map((asset, index) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          index={index}
          onPreview={onPreview}
          isSelected={selectedAssets?.has(asset.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
})
