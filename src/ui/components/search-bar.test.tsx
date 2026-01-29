import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('should render search input', () => {
    render(<SearchBar {...defaultProps} />)

    const input = screen.getByPlaceholderText('Search assets... (/)')
    expect(input).toBeInTheDocument()
  })

  it('should display current value', () => {
    render(<SearchBar {...defaultProps} value="logo" />)

    const input = screen.getByPlaceholderText('Search assets... (/)') as HTMLInputElement
    expect(input.value).toBe('logo')
  })

  it('should call onChange when input value changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText('Search assets... (/)')
    await user.type(input, 'test')

    expect(onChange).toHaveBeenCalledTimes(4)
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

    expect(screen.getByText('/')).toBeInTheDocument()
  })

  it('should show clear button when value is not empty', () => {
    render(<SearchBar {...defaultProps} value="test" />)

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
  })

  it('should hide keyboard shortcut when value is not empty', () => {
    render(<SearchBar {...defaultProps} value="test" />)

    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })

  it('should call onChange with empty string when clear button is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar {...defaultProps} value="test" onChange={onChange} />)

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('should call onFocus when input is focused', async () => {
    const onFocus = vi.fn()
    const user = userEvent.setup()

    render(<SearchBar {...defaultProps} onFocus={onFocus} />)

    const input = screen.getByPlaceholderText('Search assets... (/)')
    await user.click(input)

    expect(onFocus).toHaveBeenCalled()
  })

  it('should forward ref to input element', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<SearchBar {...defaultProps} ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.placeholder).toBe('Search assets... (/)')
  })
})
