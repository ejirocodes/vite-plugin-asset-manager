import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { IgnoredAssetsProvider, useIgnoredAssets } from './ignored-assets-provider'

describe('IgnoredAssetsProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty ignore list', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    expect(result.current.ignoredPaths.size).toBe(0)
    expect(result.current.isIgnored('test.png')).toBe(false)
  })

  it('should add asset to ignore list', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    act(() => {
      result.current.addIgnored('test.png')
    })

    expect(result.current.isIgnored('test.png')).toBe(true)
  })

  it('should remove asset from ignore list', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    act(() => {
      result.current.addIgnored('test.png')
      result.current.removeIgnored('test.png')
    })

    expect(result.current.isIgnored('test.png')).toBe(false)
  })

  it('should toggle asset ignore status', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    act(() => {
      result.current.toggleIgnored('test.png')
    })
    expect(result.current.isIgnored('test.png')).toBe(true)

    act(() => {
      result.current.toggleIgnored('test.png')
    })
    expect(result.current.isIgnored('test.png')).toBe(false)
  })

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    act(() => {
      result.current.addIgnored('test1.png')
      result.current.addIgnored('test2.png')
    })

    const stored = JSON.parse(localStorage.getItem('vite-asset-manager-ignored-assets') || '[]')
    expect(stored).toEqual(expect.arrayContaining(['test1.png', 'test2.png']))
  })

  it('should load from localStorage on mount', () => {
    localStorage.setItem('vite-asset-manager-ignored-assets', JSON.stringify(['cached.png']))

    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    expect(result.current.isIgnored('cached.png')).toBe(true)
  })

  it('should clear all ignored assets', () => {
    const { result } = renderHook(() => useIgnoredAssets(), {
      wrapper: IgnoredAssetsProvider
    })

    act(() => {
      result.current.addIgnored('test1.png')
      result.current.addIgnored('test2.png')
      result.current.clearAll()
    })

    expect(result.current.ignoredPaths.size).toBe(0)
  })

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useIgnoredAssets())
    }).toThrow('useIgnoredAssets must be used within IgnoredAssetsProvider')
  })
})
