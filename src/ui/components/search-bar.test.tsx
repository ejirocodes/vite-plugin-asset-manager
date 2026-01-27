import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './search-bar'

vi.mock('@phosphor-icons/react', () => ({
  MagnifyingGlassIcon: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className}>
      Search
    </span>
  ),
  XIcon: ({ className }: { className?: string }) => (
    <span data-testid="clear-icon" className={className}>
      X
    </span>
  ),
  CircleNotchIcon: ({ className }: { className?: string }) => (
    <span data-testid="spinner-icon" className={className}>
      Loading
    </span>
  ),
  CommandIcon: ({ className }: { className?: string }) => (
    <span data-testid="command-icon" className={className}>
      ⌘
    </span>
  )
}))

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    searching: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {})

  it('should render search input', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search assets...')
    expect(input).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(<SearchBar {...defaultProps} value="logo" />)

    const input = screen.getByPlaceholderText('Search assets...') as HTMLInputElement
    expect(input.value).toBe('logo')
  })

  it('should call onChange when input value changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText('Search assets...')
    await user.type(input, 'test')

    // For a controlled component where value doesn't update, each character
    // triggers onChange with just that character
    expect(onChange).toHaveBeenCalledTimes(4) // Once for each character
    expect(onChange).toHaveBeenNthCalledWith(1, 't')
    expect(onChange).toHaveBeenNthCalledWith(2, 'e')
    expect(onChange).toHaveBeenNthCalledWith(3, 's')
    expect(onChange).toHaveBeenNthCalledWith(4, 't')
  })

  it('should show search icon when not searching', () => {
    render(<SearchBar {...defaultProps} />)

    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('spinner-icon')).not.toBeInTheDocument()
  })

  it('should show spinner icon when searching', () => {
    render(<SearchBar {...defaultProps} searching={true} />)

    expect(screen.getByTestId('spinner-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument()
  })

  it('should show keyboard shortcut hint when empty', () => {
    render(<SearchBar {...defaultProps} />)

    expect(screen.getByTestId('command-icon')).toBeInTheDocument()
    expect(screen.getByText('K')).toBeInTheDocument()
  })

  it('should show clear button when value is not empty', () => {
    render(<SearchBar {...defaultProps} value="test" />)

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
    expect(screen.queryByTestId('command-icon')).not.toBeInTheDocument()
  })

  it('should call onChange with empty string when clear button is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />)

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should focus input on Cmd+K', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search assets...')

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    expect(document.activeElement).toBe(input)
  })

  it('should focus input on Ctrl+K', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search assets...')

    // Simulate Ctrl+K
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })

    expect(document.activeElement).toBe(input)
  })

  it('should blur input and clear value on Escape', async () => {
    const onChange = vi.fn()

    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />)

    const input = screen.getByPlaceholderText('Search assets...')

    input.focus()
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.activeElement).not.toBe(input)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should not clear value on Escape when input is not focused', () => {
    const onChange = vi.fn()

    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = render(<SearchBar {...defaultProps} />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })

  it('should prevent default on Cmd+K to avoid browser shortcut', () => {
    render(<SearchBar {...defaultProps} />)

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
      cancelable: true
    })

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
