import { memo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/ui/components/ui/dropdown-menu'
import { Button } from '@/ui/components/ui/button'
import {
  FunnelIcon,
  XIcon,
  FileIcon,
  CalendarIcon,
  DatabaseIcon,
  CheckIcon
} from '@phosphor-icons/react'
import type {
  SizeFilter,
  DateFilter,
  ExtensionFilter,
  SizeFilterPreset,
  DateFilterPreset
} from '@/shared/types'
import { cn } from '@/ui/lib/utils'

interface AdvancedFiltersProps {
  sizeFilter?: SizeFilter
  dateFilter?: DateFilter
  extensionFilter?: ExtensionFilter
  onSizeChange: (filter: SizeFilter | undefined) => void
  onDateChange: (filter: DateFilter | undefined) => void
  onExtensionChange: (filter: ExtensionFilter | undefined) => void
  onClearAll: () => void
  activeCount: number
  availableExtensions: string[]
}

const SIZE_OPTIONS: { value: SizeFilterPreset; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '< 100 KB' },
  { value: 'medium', label: 'Medium', description: '100 KB – 1 MB' },
  { value: 'large', label: 'Large', description: '1 – 10 MB' },
  { value: 'xlarge', label: 'Extra large', description: '> 10 MB' }
]

const DATE_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'last90days', label: 'Last 90 days' },
  { value: 'thisYear', label: 'This year' }
]

export const AdvancedFilters = memo(function AdvancedFilters({
  sizeFilter,
  dateFilter,
  extensionFilter,
  onSizeChange,
  onDateChange,
  onExtensionChange,
  onClearAll,
  activeCount,
  availableExtensions
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)

  const handleSizeSelect = (preset: SizeFilterPreset) => {
    if (sizeFilter?.preset === preset) {
      onSizeChange(undefined)
    } else {
      onSizeChange({ preset })
    }
  }

  const handleDateSelect = (preset: DateFilterPreset) => {
    if (dateFilter?.preset === preset) {
      onDateChange(undefined)
    } else {
      onDateChange({ preset })
    }
  }

  const handleExtensionToggle = (ext: string) => {
    const current = extensionFilter?.extensions || []
    const updated = current.includes(ext)
      ? current.filter(e => e !== ext)
      : [...current, ext]
    onExtensionChange(updated.length > 0 ? { extensions: updated } : undefined)
  }

  const handleClearAll = () => {
    onClearAll()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 h-8 px-2.5 font-medium transition-all duration-200',
            'border-border/60 hover:border-border hover:bg-accent/50',
            activeCount > 0 && 'border-primary/40 bg-primary/5 hover:bg-primary/10'
          )}
        >
          <FunnelIcon
            weight="bold"
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              activeCount > 0 ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <span className={cn(activeCount > 0 && 'text-primary')}>Filters</span>
          {activeCount > 0 && (
            <span
              className={cn(
                'ml-0.5 flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1 rounded-full',
                'bg-primary text-primary-foreground',
                'text-[10px] font-semibold tabular-nums',
                'animate-in zoom-in-50 duration-150'
              )}
            >
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(
          'w-72 p-0 overflow-hidden',
          'bg-popover/95 backdrop-blur-xl',
          'border border-border/50',
          'shadow-xl shadow-black/10',
          'animate-in fade-in-0 zoom-in-95 duration-150'
        )}
      >
        <div className="max-h-[420px] overflow-y-auto overscroll-contain">
          {/* Size Filter Section */}
          <FilterSection
            icon={<DatabaseIcon weight="bold" className="w-3.5 h-3.5" />}
            title="File Size"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {SIZE_OPTIONS.map(option => (
                <FilterChip
                  key={option.value}
                  selected={sizeFilter?.preset === option.value}
                  onClick={() => handleSizeSelect(option.value)}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground/80">
                    {option.description}
                  </span>
                </FilterChip>
              ))}
            </div>
          </FilterSection>

          {/* Date Filter Section */}
          <FilterSection
            icon={<CalendarIcon weight="bold" className="w-3.5 h-3.5" />}
            title="Modified"
          >
            <div className="flex flex-wrap gap-1.5">
              {DATE_OPTIONS.map(option => (
                <FilterPill
                  key={option.value}
                  selected={dateFilter?.preset === option.value}
                  onClick={() => handleDateSelect(option.value)}
                >
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </FilterSection>

          {/* Extension Filter Section */}
          {availableExtensions.length > 0 && (
            <FilterSection
              icon={<FileIcon weight="bold" className="w-3.5 h-3.5" />}
              title="Extensions"
              scrollable
            >
              <div className="flex flex-wrap gap-1">
                {availableExtensions.sort().map(ext => (
                  <FilterPill
                    key={ext}
                    selected={extensionFilter?.extensions?.includes(ext)}
                    onClick={() => handleExtensionToggle(ext)}
                    mono
                  >
                    {ext}
                  </FilterPill>
                ))}
              </div>
            </FilterSection>
          )}
        </div>

        {/* Clear All Footer */}
        {activeCount > 0 && (
          <div
            className={cn(
              'flex items-center justify-between',
              'px-3 py-2.5 border-t border-border/50',
              'bg-muted/30'
            )}
          >
            <span className="text-xs text-muted-foreground">
              {activeCount} {activeCount === 1 ? 'filter' : 'filters'} active
            </span>
            <button
              onClick={handleClearAll}
              className={cn(
                'inline-flex items-center gap-1',
                'text-xs font-medium text-muted-foreground',
                'hover:text-foreground transition-colors',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded'
              )}
            >
              <XIcon weight="bold" className="w-3 h-3" />
              Clear all
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

interface FilterSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  scrollable?: boolean
}

function FilterSection({ icon, title, children, scrollable }: FilterSectionProps) {
  return (
    <div className="px-3 py-3 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </span>
      </div>
      <div className={cn(scrollable && 'max-h-28 overflow-y-auto overscroll-contain pr-1')}>
        {children}
      </div>
    </div>
  )
}

interface FilterChipProps {
  selected?: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterChip({ selected, onClick, children }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start',
        'px-2.5 py-2 rounded-lg',
        'text-left text-xs',
        'border transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        selected
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-muted/40 border-transparent hover:bg-muted/70 hover:border-border/50'
      )}
    >
      {selected && (
        <CheckIcon
          weight="bold"
          className="absolute top-1.5 right-1.5 w-3 h-3 text-primary animate-in zoom-in-50 duration-100"
        />
      )}
      {children}
    </button>
  )
}

interface FilterPillProps {
  selected?: boolean
  onClick: () => void
  children: React.ReactNode
  mono?: boolean
}

function FilterPill({ selected, onClick, children, mono }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1',
        'px-2 py-1 rounded-md',
        'text-xs transition-all duration-150',
        'border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        mono && 'font-mono',
        selected
          ? 'bg-primary/15 border-primary/30 text-primary font-medium'
          : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      )}
    >
      {selected && <CheckIcon weight="bold" className="w-2.5 h-2.5 flex-shrink-0" />}
      {children}
    </button>
  )
}
