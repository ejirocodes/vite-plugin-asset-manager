import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualGrid } from './useVirtualGrid'

const mockScrollToIndex = vi.fn()

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(({ count, estimateSize }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 5) }, (_, i) => ({
        index: i,
        start: i * estimateSize(),
        size: estimateSize(),
        key: i
      })),
    getTotalSize: () => count * estimateSize(),
    scrollToIndex: mockScrollToIndex
  }))
}))

describe('useVirtualGrid', () => {
  const createScrollRef = () => {
    const div = document.createElement('div')
    return { current: div }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('row calculation', () => {
    it('calculates correct row count for exact multiple', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      expect(result.current.virtualRows).toHaveLength(3)
    })

    it('calculates correct row count for partial last row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      expect(result.current.virtualRows).toHaveLength(3)
    })

    it('handles empty items array', () => {
      const scrollElement = createScrollRef()

      const { result } = renderHook(() =>
        useVirtualGrid({
          items: [],
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      expect(result.current.virtualRows).toHaveLength(0)
      expect(result.current.totalHeight).toBe(0)
    })

    it('handles fewer items than columns', () => {
      const scrollElement = createScrollRef()
      const items = [{ id: 1 }, { id: 2 }]

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      expect(result.current.virtualRows).toHaveLength(1)
    })
  })

  describe('getRowItems', () => {
    it('returns correct items for first row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      const rowItems = result.current.getRowItems(0)
      expect(rowItems).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }])
    })

    it('returns correct items for middle row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      const rowItems = result.current.getRowItems(1)
      expect(rowItems).toEqual([{ id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }])
    })

    it('returns partial items for incomplete last row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      const rowItems = result.current.getRowItems(2)
      expect(rowItems).toEqual([{ id: 8 }, { id: 9 }])
    })

    it('returns empty array for out-of-bounds row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 4 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      const rowItems = result.current.getRowItems(5)
      expect(rowItems).toEqual([])
    })
  })

  describe('scrollToItem', () => {
    it('calculates correct row index from item index', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      act(() => {
        result.current.scrollToItem(9)
      })

      expect(mockScrollToIndex).toHaveBeenCalledWith(2, { align: 'center' })
    })

    it('scrolls to first row for items in first row', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      act(() => {
        result.current.scrollToItem(3)
      })

      expect(mockScrollToIndex).toHaveBeenCalledWith(0, { align: 'center' })
    })
  })

  describe('totalHeight', () => {
    it('calculates total height with default gap', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 8 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200
        })
      )

      expect(result.current.totalHeight).toBe(2 * (200 + 16))
    })

    it('calculates total height with custom gap', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 8 }, (_, i) => ({ id: i }))

      const { result } = renderHook(() =>
        useVirtualGrid({
          items,
          columns: 4,
          scrollElement,
          rowHeight: 200,
          gap: 24
        })
      )

      expect(result.current.totalHeight).toBe(2 * (200 + 24))
    })
  })

  describe('dependency updates', () => {
    it('recalculates when items change', () => {
      const scrollElement = createScrollRef()
      const initialItems = Array.from({ length: 4 }, (_, i) => ({ id: i }))

      const { result, rerender } = renderHook(
        ({ items }) =>
          useVirtualGrid({
            items,
            columns: 4,
            scrollElement,
            rowHeight: 200
          }),
        { initialProps: { items: initialItems } }
      )

      expect(result.current.virtualRows).toHaveLength(1)

      const newItems = Array.from({ length: 12 }, (_, i) => ({ id: i }))
      rerender({ items: newItems })

      expect(result.current.virtualRows).toHaveLength(3)
    })

    it('recalculates when columns change', () => {
      const scrollElement = createScrollRef()
      const items = Array.from({ length: 12 }, (_, i) => ({ id: i }))

      const { result, rerender } = renderHook(
        ({ columns }) =>
          useVirtualGrid({
            items,
            columns,
            scrollElement,
            rowHeight: 200
          }),
        { initialProps: { columns: 4 } }
      )

      expect(result.current.getRowItems(0)).toHaveLength(4)

      rerender({ columns: 3 })

      expect(result.current.getRowItems(0)).toHaveLength(3)
    })
  })
})
