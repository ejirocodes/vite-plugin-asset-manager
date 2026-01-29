import { useVirtualizer } from '@tanstack/react-virtual'
import { RefObject, useCallback } from 'react'

interface UseVirtualGridOptions<T> {
  items: T[]
  columns: number
  scrollElement: RefObject<HTMLElement | null>
  rowHeight: number
  gap?: number
  overscan?: number
}

export function useVirtualGrid<T>({
  items,
  columns,
  scrollElement,
  rowHeight,
  gap = 16,
  overscan = 2
}: UseVirtualGridOptions<T>) {
  const rowCount = Math.ceil(items.length / columns)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement.current,
    estimateSize: () => rowHeight + gap,
    overscan
  })

  const getRowItems = useCallback(
    (rowIndex: number): T[] => {
      const start = rowIndex * columns
      return items.slice(start, start + columns)
    },
    [items, columns]
  )

  const scrollToItem = useCallback(
    (itemIndex: number) => {
      const rowIndex = Math.floor(itemIndex / columns)
      virtualizer.scrollToIndex(rowIndex, { align: 'center' })
    },
    [columns, virtualizer]
  )

  return {
    virtualRows: virtualizer.getVirtualItems(),
    totalHeight: virtualizer.getTotalSize(),
    getRowItems,
    scrollToItem
  }
}
