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
      case 'name':
        comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'mtime':
        comparison = a.mtime - b.mtime
        break
      case 'type':
        comparison = a.type.localeCompare(b.type)
        break
    }
    return comparison * multiplier
  })
}
