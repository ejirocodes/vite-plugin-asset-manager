import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/ui/components/ui/select'
import { ArrowsDownUpIcon } from '@phosphor-icons/react'
import { cn } from '@/ui/lib/utils'
import type { SortOption, SortField, SortDirection } from '@/ui/lib/sort-utils'

interface SortControlsProps {
  value: SortOption
  onChange: (option: SortOption) => void
}

type SortOptionValue = `${SortField}-${SortDirection}`

const SORT_OPTIONS: { value: SortOptionValue; label: string }[] = [
  { value: 'name-asc', label: 'Name (A → Z)' },
  { value: 'name-desc', label: 'Name (Z → A)' },
  { value: 'size-asc', label: 'Size (Smallest)' },
  { value: 'size-desc', label: 'Size (Largest)' },
  { value: 'mtime-desc', label: 'Date (Newest)' },
  { value: 'mtime-asc', label: 'Date (Oldest)' },
  { value: 'type-asc', label: 'Type (A → Z)' },
  { value: 'type-desc', label: 'Type (Z → A)' }
]

function parseValue(value: SortOptionValue): SortOption {
  const [field, direction] = value.split('-') as [SortField, SortDirection]
  return { field, direction }
}

function toValue(option: SortOption): SortOptionValue {
  return `${option.field}-${option.direction}`
}

export function SortControls({ value, onChange }: SortControlsProps) {
  const currentValue = toValue(value)

  const handleValueChange = (newValue: SortOptionValue | null) => {
    if (newValue) {
      onChange(parseValue(newValue))
    }
  }

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          'h-7! px-2.5 gap-1.5',
          'bg-input/20 dark:bg-input/30 border-border/50 hover:bg-input/30 dark:hover:bg-input/40'
        )}
      >
        <ArrowsDownUpIcon weight="bold" className="w-3.5 h-3.5 text-muted-foreground" />
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
