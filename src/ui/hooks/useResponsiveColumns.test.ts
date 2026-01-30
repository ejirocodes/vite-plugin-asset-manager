import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsiveColumns } from './useResponsiveColumns'

// The hook uses dynamic calculation: cols = Math.floor((availableWidth + GAP) / (MIN_CARD_WIDTH + GAP))
// where availableWidth = containerWidth - 48 (for px-6 padding), MIN_CARD_WIDTH = 180, GAP = 24
// Formula: cols = Math.floor((width - 48 + 24) / (180 + 24)) = Math.floor((width - 24) / 204)
function expectedColumns(width: number): number {
  const availableWidth = width - 48
  const cols = Math.floor((availableWidth + 24) / (180 + 24))
  return Math.max(1, cols)
}

describe('useResponsiveColumns', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
  })

  function setWindowWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    })
  }

  describe('dynamic column calculation', () => {
    it('returns 1 column for narrow width (400px)', () => {
      setWindowWidth(400)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(400))
    })

    it('returns 2 columns for width 640px', () => {
      setWindowWidth(640)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(640))
    })

    it('returns 3 columns for width 768px', () => {
      setWindowWidth(768)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(768))
    })

    it('returns 4 columns for width 1024px', () => {
      setWindowWidth(1024)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(1024))
    })

    it('returns 6 columns for width 1280px', () => {
      setWindowWidth(1280)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(1280))
    })

    it('returns 7 columns for width 1536px', () => {
      setWindowWidth(1536)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(1536))
    })
  })

  describe('resize behavior', () => {
    it('updates columns when window resize event fires', () => {
      setWindowWidth(1024)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(1024))

      act(() => {
        setWindowWidth(1536)
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(expectedColumns(1536))
    })

    it('updates from large to small screen', () => {
      setWindowWidth(1536)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(expectedColumns(1536))

      act(() => {
        setWindowWidth(400)
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(expectedColumns(400))
    })
  })

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      setWindowWidth(1024)
      const { unmount } = renderHook(() => useResponsiveColumns())

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})
