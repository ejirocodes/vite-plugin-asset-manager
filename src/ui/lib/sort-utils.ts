import type { Asset } from '@/shared/types'

export type SortField = 'name' | 'size' | 'mtime' | 'type'
export type SortDirection = 'asc' | 'desc'

export interface SortOption {
  field: SortField
  direction: SortDirection
}

export function sortAssets(assets: Asset[], option: SortOption): Asset[] {
  const { field, direction } = option
  const multiplier = direction === 'asc' ? 1 : -1

  return [...assets].sort((a, b) => {
    let comparison = 0
    switch (field) {
      case 'name': {
        const aName = a.name
        const bName = b.name
        comparison = aName.localeCompare(bName, undefined, { sensitivity: 'base' })
        break
      }
      case 'size': {
        const aSize = a.size
        const bSize = b.size
        comparison = aSize - bSize
        break
      }
      case 'mtime': {
        const aMtime = a.mtime
        const bMtime = b.mtime
        comparison = aMtime - bMtime
        break
      }
      case 'type': {
        const aType = a.type
        const bType = b.type
        comparison = aType.localeCompare(bType)
        break
      }
    }
    return comparison * multiplier
  })
}
