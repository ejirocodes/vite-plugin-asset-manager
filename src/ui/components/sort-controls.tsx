import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/ui/components/ui/select'
import { SortAscendingIcon } from '@phosphor-icons/react'
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
    <div className="flex items-center gap-2">
      <SortAscendingIcon className="w-4 h-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger size="sm">
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
    </div>
  )
}
