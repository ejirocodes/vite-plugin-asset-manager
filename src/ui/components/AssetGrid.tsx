import { AssetCard } from './AssetCard'
import type { Asset } from '../types'

interface AssetGridProps {
  assets: Asset[]
  onPreview?: (asset: Asset) => void
}

export function AssetGrid({ assets, onPreview }: AssetGridProps) {
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
      {assets.map((asset, index) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          index={index}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}
