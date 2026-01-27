import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssetCard } from './asset-card'
import type { Asset } from '../types'

vi.mock('@phosphor-icons/react', () => ({
  CopyIcon: ({ className }: { className?: string }) => (
    <span data-testid="copy-icon" className={className}>
      Copy
    </span>
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <span data-testid="check-icon" className={className}>
      Check
    </span>
  ),
  EyeSlashIcon: ({ className }: { className?: string }) => (
    <span data-testid="eye-slash-icon" className={className}>
      EyeSlash
    </span>
  )
}))

vi.mock('./card-previews', () => ({
  VideoCardPreview: ({ asset }: { asset: Asset }) => (
    <div data-testid="video-preview">{asset.name}</div>
  ),
  FontCardPreview: ({ asset }: { asset: Asset }) => (
    <div data-testid="font-preview">{asset.name}</div>
  )
}))

vi.mock('./file-icon', () => ({
  FileIcon: ({ extension }: { extension: string }) => (
    <span data-testid="file-icon">{extension}</span>
  ),
  getFileTypeColor: () => 'text-blue-500'
}))

let mockIgnoredPaths = new Set<string>()

vi.mock('../providers/ignored-assets-provider', () => ({
  useIgnoredAssets: () => ({
    ignoredPaths: mockIgnoredPaths,
    isIgnored: (path: string) => mockIgnoredPaths.has(path),
    addIgnored: (path: string) => {
      mockIgnoredPaths.add(path)
    },
    removeIgnored: (path: string) => {
      mockIgnoredPaths.delete(path)
    },
    toggleIgnored: (path: string) => {
      if (mockIgnoredPaths.has(path)) {
        mockIgnoredPaths.delete(path)
      } else {
        mockIgnoredPaths.add(path)
      }
    },
    clearAll: () => {
      mockIgnoredPaths.clear()
    }
  })
}))

describe('AssetCard', () => {
  const mockImageAsset: Asset = {
    id: 'test-image-id',
    name: 'logo.png',
    path: 'src/assets/logo.png',
    absolutePath: '/project/src/assets/logo.png',
    extension: '.png',
    type: 'image',
    size: 2048,
    mtime: Date.now(),
    directory: 'src/assets'
  }

  const mockVideoAsset: Asset = {
    ...mockImageAsset,
    id: 'test-video-id',
    name: 'video.mp4',
    path: 'src/assets/video.mp4',
    extension: '.mp4',
    type: 'video'
  }

  const mockFontAsset: Asset = {
    ...mockImageAsset,
    id: 'test-font-id',
    name: 'font.woff2',
    path: 'src/assets/font.woff2',
    extension: '.woff2',
    type: 'font'
  }

  const mockOtherAsset: Asset = {
    ...mockImageAsset,
    id: 'test-other-id',
    name: 'data.json',
    path: 'src/assets/data.json',
    extension: '.json',
    type: 'data'
  }

  let mockWriteText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockIgnoredPaths.clear()
    mockWriteText = vi.fn().mockResolvedValue(undefined)

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
        readText: vi.fn().mockResolvedValue(''),
        read: vi.fn(),
        write: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      },
      writable: true,
      configurable: true
    })
  })

  it('should render asset name', () => {
    render(<AssetCard asset={mockImageAsset} />)

    expect(screen.getByText('logo.png')).toBeInTheDocument()
  })

  it('should render file extension', () => {
    render(<AssetCard asset={mockImageAsset} />)

    expect(screen.getByText('png')).toBeInTheDocument()
  })

  it('should render formatted file size', () => {
    render(<AssetCard asset={mockImageAsset} />)

    expect(screen.getByText('2 KB')).toBeInTheDocument()
  })

  it('should render thumbnail for image assets', () => {
    render(<AssetCard asset={mockImageAsset} />)

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute(
      'src',
      '/__asset_manager__/api/thumbnail?path=src%2Fassets%2Flogo.png'
    )
    expect(img).toHaveAttribute('alt', 'logo.png')
  })

  it('should render video preview for video assets', () => {
    render(<AssetCard asset={mockVideoAsset} />)

    expect(screen.getByTestId('video-preview')).toBeInTheDocument()
  })

  it('should render font preview for font assets', () => {
    render(<AssetCard asset={mockFontAsset} />)

    expect(screen.getByTestId('font-preview')).toBeInTheDocument()
  })

  it('should render file icon for other asset types', () => {
    render(<AssetCard asset={mockOtherAsset} />)

    expect(screen.getByTestId('file-icon')).toBeInTheDocument()
  })

  it('should call onPreview when card is clicked', async () => {
    const onPreview = vi.fn()
    const user = userEvent.setup()

    render(<AssetCard asset={mockImageAsset} onPreview={onPreview} />)

    const card = screen.getByText('logo.png').closest('div[class*="cursor-pointer"]')!
    await user.click(card)

    expect(onPreview).toHaveBeenCalledWith(mockImageAsset)
  })

  it('should copy path to clipboard when copy button is clicked', async () => {
    render(<AssetCard asset={mockImageAsset} />)

    const copyButton = screen.getByRole('button', { name: /copy file path/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('src/assets/logo.png')
    })
  })

  it('should show checkmark after copying', async () => {
    const user = userEvent.setup()
    vi.useFakeTimers({ shouldAdvanceTime: true })

    render(<AssetCard asset={mockImageAsset} />)

    const copyButton = screen.getByRole('button', { name: /copy file path/i })

    expect(screen.getByTestId('copy-icon')).toBeInTheDocument()

    await user.click(copyButton)

    expect(screen.getByTestId('check-icon')).toBeInTheDocument()

    vi.advanceTimersByTime(2100)

    await waitFor(() => {
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('should not trigger onPreview when copy button is clicked', async () => {
    const onPreview = vi.fn()
    const user = userEvent.setup()

    render(<AssetCard asset={mockImageAsset} onPreview={onPreview} />)

    const copyButton = screen.getByRole('button', { name: /copy file path/i })
    await user.click(copyButton)

    expect(onPreview).not.toHaveBeenCalled()
  })

  it('should handle image load error', () => {
    render(<AssetCard asset={mockImageAsset} />)

    const img = screen.getByRole('img')
    fireEvent.error(img)

    expect(screen.getByTestId('file-icon')).toBeInTheDocument()
  })

  it('should format bytes correctly', () => {
    const assets = [
      { ...mockImageAsset, size: 0 },
      { ...mockImageAsset, size: 512 },
      { ...mockImageAsset, size: 1024 },
      { ...mockImageAsset, size: 1024 * 1024 },
      { ...mockImageAsset, size: 1024 * 1024 * 1024 }
    ]

    const { rerender } = render(<AssetCard asset={assets[0]} />)
    expect(screen.getByText('0 B')).toBeInTheDocument()

    rerender(<AssetCard asset={assets[1]} />)
    expect(screen.getByText('512 B')).toBeInTheDocument()

    rerender(<AssetCard asset={assets[2]} />)
    expect(screen.getByText('1 KB')).toBeInTheDocument()

    rerender(<AssetCard asset={assets[3]} />)
    expect(screen.getByText('1 MB')).toBeInTheDocument()

    rerender(<AssetCard asset={assets[4]} />)
    expect(screen.getByText('1 GB')).toBeInTheDocument()
  })

  it('should apply stagger animation class based on index', () => {
    const { container } = render(<AssetCard asset={mockImageAsset} index={3} />)

    expect(container.querySelector('.stagger-4')).toBeInTheDocument()
  })

  it('should cap stagger class at 8', () => {
    const { container } = render(<AssetCard asset={mockImageAsset} index={15} />)

    expect(container.querySelector('.stagger-8')).toBeInTheDocument()
  })

  describe('unused badge', () => {
    it('should show UNUSED badge when importersCount is 0', () => {
      const unusedAsset: Asset = {
        ...mockImageAsset,
        importersCount: 0
      }

      render(<AssetCard asset={unusedAsset} />)

      const badge = screen.getByText('UNUSED')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-label', 'This asset is not imported by any source files')
      expect(badge).toHaveAttribute('title', 'This asset is not imported by any source files')
    })

    it('should not show UNUSED badge when asset is used', () => {
      const usedAsset: Asset = {
        ...mockImageAsset,
        importersCount: 3
      }

      render(<AssetCard asset={usedAsset} />)

      expect(screen.queryByText('UNUSED')).not.toBeInTheDocument()
    })

    it('should not show UNUSED badge when importersCount is undefined', () => {
      const assetWithoutCount: Asset = {
        ...mockImageAsset,
        importersCount: undefined
      }

      render(<AssetCard asset={assetWithoutCount} />)

      expect(screen.queryByText('UNUSED')).not.toBeInTheDocument()
    })

    it('should have amber styling for unused badge', () => {
      const unusedAsset: Asset = {
        ...mockImageAsset,
        importersCount: 0
      }

      render(<AssetCard asset={unusedAsset} />)

      const badge = screen.getByText('UNUSED')
      expect(badge).toHaveClass('bg-amber-500/10')
      expect(badge).toHaveClass('text-amber-400')
      expect(badge).toHaveClass('border-amber-500/20')
    })
  })

  describe('ignored badge', () => {
    it('should show UNUSED badge for unused, non-ignored assets', () => {
      const unusedAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/not-ignored.png',
        importersCount: 0
      }

      render(<AssetCard asset={unusedAsset} />)

      expect(screen.getByText('UNUSED')).toBeInTheDocument()
      expect(screen.queryByText('IGNORED')).not.toBeInTheDocument()
    })

    it('should show IGNORED badge instead of UNUSED when asset is ignored', () => {
      const unusedAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/ignored.png',
        importersCount: 0
      }

      mockIgnoredPaths.add('src/assets/ignored.png')

      render(<AssetCard asset={unusedAsset} />)

      expect(screen.queryByText('UNUSED')).not.toBeInTheDocument()
      expect(screen.getByText('IGNORED')).toBeInTheDocument()
    })

    it('should show no badge for used assets', () => {
      const usedAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/used.png',
        importersCount: 3
      }

      render(<AssetCard asset={usedAsset} />)

      expect(screen.queryByText('UNUSED')).not.toBeInTheDocument()
      expect(screen.queryByText('IGNORED')).not.toBeInTheDocument()
    })

    it('should show eye-slash icon in IGNORED badge', () => {
      const ignoredAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/ignored.png',
        importersCount: 0
      }

      mockIgnoredPaths.add('src/assets/ignored.png')

      render(<AssetCard asset={ignoredAsset} />)

      expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument()
    })

    it('should have muted styling for ignored badge', () => {
      const ignoredAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/ignored.png',
        importersCount: 0
      }

      mockIgnoredPaths.add('src/assets/ignored.png')

      render(<AssetCard asset={ignoredAsset} />)

      const badge = screen.getByText('IGNORED')
      expect(badge).toHaveClass('bg-muted/50')
      expect(badge).toHaveClass('text-muted-foreground')
      expect(badge).toHaveClass('border-border')
    })

    it('should have accessibility attributes for IGNORED badge', () => {
      const ignoredAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/ignored.png',
        importersCount: 0
      }

      mockIgnoredPaths.add('src/assets/ignored.png')

      render(<AssetCard asset={ignoredAsset} />)

      const badge = screen.getByText('IGNORED')
      expect(badge).toHaveAttribute('aria-label', 'This asset is marked as intentionally unused')
      expect(badge).toHaveAttribute('title', 'Marked as intentionally unused')
    })

    it('should not show IGNORED badge for used assets even if in ignore list', () => {
      const usedButIgnoredAsset: Asset = {
        ...mockImageAsset,
        path: 'src/assets/used-ignored.png',
        importersCount: 5
      }

      mockIgnoredPaths.add('src/assets/used-ignored.png')

      render(<AssetCard asset={usedButIgnoredAsset} />)

      expect(screen.queryByText('IGNORED')).not.toBeInTheDocument()
      expect(screen.queryByText('UNUSED')).not.toBeInTheDocument()
    })
  })
})
