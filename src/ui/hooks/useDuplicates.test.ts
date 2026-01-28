import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDuplicates } from './useDuplicates'

vi.mock('./useSSE', () => ({
  useSSE: () => ({
    subscribe: vi.fn().mockReturnValue(() => {})
  })
}))

describe('useDuplicates', () => {
  const mockDuplicates = [
    {
      id: 'aW1hZ2UxLnBuZw',
      name: 'image1.png',
      path: 'src/image1.png',
      absolutePath: '/project/src/image1.png',
      extension: '.png',
      type: 'image',
      size: 1024,
      mtime: Date.now(),
      directory: 'src',
      contentHash: 'abc123',
      duplicatesCount: 1
    },
    {
      id: 'aW1hZ2UyLnBuZw',
      name: 'image2.png',
      path: 'src/image2.png',
      absolutePath: '/project/src/image2.png',
      extension: '.png',
      type: 'image',
      size: 1024,
      mtime: Date.now(),
      directory: 'src',
      contentHash: 'abc123',
      duplicatesCount: 1
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        duplicates: mockDuplicates,
        total: 2,
        hash: 'abc123'
      })
    })
  })

  it('should fetch duplicates on mount', async () => {
    const { result } = renderHook(() => useDuplicates('abc123'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledWith('/__asset_manager__/api/duplicates?hash=abc123')
    expect(result.current.duplicates).toHaveLength(2)
  })

  it('should handle undefined content hash', async () => {
    const { result } = renderHook(() => useDuplicates(undefined))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.duplicates).toEqual([])
  })

  it('should handle empty content hash', async () => {
    const { result } = renderHook(() => useDuplicates(''))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.duplicates).toEqual([])
  })

  it('should handle fetch errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useDuplicates('abc123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch duplicates')
  })

  it('should handle network errors', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDuplicates('abc123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should refetch when content hash changes', async () => {
    const { result, rerender } = renderHook(({ hash }) => useDuplicates(hash), {
      initialProps: { hash: 'abc123' }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    rerender({ hash: 'def456' })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    expect(fetch).toHaveBeenLastCalledWith('/__asset_manager__/api/duplicates?hash=def456')
  })

  it('should return correct initial state', () => {
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useDuplicates('abc123'))

    expect(result.current.duplicates).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should encode hash in URL', async () => {
    const { result } = renderHook(() => useDuplicates('hash/with/special+chars'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledWith(
      '/__asset_manager__/api/duplicates?hash=hash%2Fwith%2Fspecial%2Bchars'
    )
  })
})
