import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAssets } from './useAssets'
import type { AssetType } from '../types'

const mockSubscribe = vi.fn().mockReturnValue(() => {})

vi.mock('./useSSE', () => ({
  useSSE: () => ({
    subscribe: mockSubscribe
  })
}))

describe('useAssets', () => {
  const mockGroups = [
    {
      directory: 'src/assets',
      assets: [
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
      ],
      count: 1
    }
  ]

  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscribe.mockClear()
    mockSubscribe.mockReturnValue(() => {})

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          groups: mockGroups,
          total: 1
        })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch assets on mount', async () => {
    const { result } = renderHook(() => useAssets())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalledWith('/__asset_manager__/api/assets/grouped')
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.total).toBe(1)
  })

  it('should handle fetch errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useAssets())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch assets')
    expect(result.current.groups).toEqual([])
  })

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAssets())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('should include type filter in request when provided', async () => {
    const { result } = renderHook(() => useAssets('image'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalledWith('/__asset_manager__/api/assets/grouped?type=image')
  })

  it('should refetch assets when refetch is called', async () => {
    const { result } = renderHook(() => useAssets())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refetch()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('should refetch when type filter changes', async () => {
    const { result, rerender } = renderHook(({ typeFilter }) => useAssets(typeFilter), {
      initialProps: { typeFilter: undefined as AssetType | undefined }
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    rerender({ typeFilter: 'video' })

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    expect(fetchMock).toHaveBeenLastCalledWith('/__asset_manager__/api/assets/grouped?type=video')
  })

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useAssets())

    expect(result.current.groups).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.refetch).toBeInstanceOf(Function)
  })

  it('should clear error on successful refetch', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useAssets())

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch assets')
    })

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ groups: mockGroups, total: 1 })
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.groups).toHaveLength(1)
  })
})
