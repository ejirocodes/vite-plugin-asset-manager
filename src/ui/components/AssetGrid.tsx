import { AssetCard } from './AssetCard'
import type { Asset } from '../types'

interface AssetGridProps {
  assets: Asset[]
}

export function AssetGrid({ assets }: AssetGridProps) {
  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {assets.map(asset => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
