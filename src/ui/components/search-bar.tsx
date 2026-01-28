import { forwardRef } from 'react'
import { MagnifyingGlassIcon, XIcon, CircleNotchIcon } from '@phosphor-icons/react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  searching: boolean
  onFocus?: () => void
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, onChange, searching, onFocus },
  ref
) {

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {searching ? (
          <CircleNotchIcon weight="bold" className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <MagnifyingGlassIcon
            weight="bold"
            className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
          />
        )}
      </div>

      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder="Search assets... (/)"
        className="
          w-full pl-10 pr-20 py-2.5
          bg-input/50 border border-border rounded-lg
          text-sm text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
          transition-all duration-200
        "
      />

      <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
        {value ? (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <XIcon
              weight="bold"
              className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"
            />
          </button>
        ) : (
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground">
            <span>/</span>
          </kbd>
        )}
      </div>
    </div>
  )
})

SearchBar.displayName = 'SearchBar'
