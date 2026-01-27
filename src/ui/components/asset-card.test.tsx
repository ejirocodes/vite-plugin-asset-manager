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
})
