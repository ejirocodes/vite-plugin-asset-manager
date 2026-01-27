import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearch } from './useSearch'

describe('useSearch', () => {
  const mockAssets = [
    {
      id: 'test-id',
      name: 'logo.png',
      path: 'src/assets/logo.png',
      absolutePath: '/project/src/assets/logo.png',
      extension: '.png',
      type: 'image',
      size: 1024,
      mtime: Date.now(),
      directory: 'src/assets'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        assets: mockAssets,
        total: 1,
        query: 'logo'
      })
    })
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => useSearch())

    expect(result.current.results).toEqual([])
    expect(result.current.searching).toBe(false)
    expect(result.current.search).toBeInstanceOf(Function)
    expect(result.current.clear).toBeInstanceOf(Function)
  })

  it('should search assets by query', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('logo')
    })

    expect(fetch).toHaveBeenCalledWith('/__asset_manager__/api/search?q=logo')
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].name).toBe('logo.png')
  })

  it('should encode query parameters', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('test image')
    })

    expect(fetch).toHaveBeenCalledWith('/__asset_manager__/api/search?q=test%20image')
  })

  it('should not search with empty query', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('')
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it('should not search with whitespace-only query', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('   ')
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it('should set searching state during request', async () => {
    let resolvePromise: () => void
    const pendingPromise = new Promise<void>(resolve => {
      resolvePromise = resolve
    })

    globalThis.fetch = vi.fn().mockImplementation(async () => {
      await pendingPromise
      return {
        ok: true,
        json: async () => ({ assets: mockAssets, total: 1 })
      }
    })

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.search('logo')
    })

    expect(result.current.searching).toBe(true)

    await act(async () => {
      resolvePromise!()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current.searching).toBe(false)
  })

  it('should handle search errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('logo')
    })

    expect(result.current.results).toEqual([])
    expect(result.current.searching).toBe(false)
  })

  it('should handle network errors gracefully', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('logo')
    })

    expect(result.current.results).toEqual([])
    expect(result.current.searching).toBe(false)
  })

  it('should clear results', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('logo')
    })

    expect(result.current.results).toHaveLength(1)

    act(() => {
      result.current.clear()
    })

    expect(result.current.results).toEqual([])
  })

  it('should handle special characters in query', async () => {
    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await result.current.search('file@2x.png')
    })

    expect(fetch).toHaveBeenCalledWith('/__asset_manager__/api/search?q=file%402x.png')
  })
})
