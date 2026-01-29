import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResponsiveColumns } from './useResponsiveColumns'

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

  describe('breakpoint column mapping', () => {
    it('returns 1 column for width < 640px', () => {
      setWindowWidth(400)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(1)
    })

    it('returns 2 columns for width >= 640px (sm)', () => {
      setWindowWidth(640)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(2)
    })

    it('returns 3 columns for width >= 768px (md)', () => {
      setWindowWidth(768)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(3)
    })

    it('returns 4 columns for width >= 1024px (lg)', () => {
      setWindowWidth(1024)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(4)
    })

    it('returns 5 columns for width >= 1280px (xl)', () => {
      setWindowWidth(1280)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(5)
    })

    it('returns 6 columns for width >= 1536px (2xl)', () => {
      setWindowWidth(1536)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(6)
    })
  })

  describe('resize behavior', () => {
    it('updates columns when window resize event fires', () => {
      setWindowWidth(1024)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(4)

      act(() => {
        setWindowWidth(1536)
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(6)
    })

    it('updates from large to small screen', () => {
      setWindowWidth(1536)
      const { result } = renderHook(() => useResponsiveColumns())
      expect(result.current).toBe(6)

      act(() => {
        setWindowWidth(400)
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current).toBe(1)
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
