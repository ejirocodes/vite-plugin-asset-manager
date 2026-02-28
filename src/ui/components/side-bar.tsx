import { memo } from 'react'
import { SearchBar } from './search-bar'
import { ModeToggle } from './mode-toggle'
import {
  ImagesIcon,
  VideoCameraIcon,
  MusicNoteIcon,
  FileTextIcon,
  PackageIcon,
  TextTIcon,
  DatabaseIcon,
  ArticleIcon,
  FileIcon,
  WarningCircleIcon,
  CopyIcon,
  LightningIcon
} from '@phosphor-icons/react'
import packageJson from '../../../package.json'
import type { AssetType } from '../types'
import { useSSE, type SSEConnectionStatus } from '../hooks/useSSE'

interface SidebarProps {
  total: number
  searchQuery: string
  onSearchChange: (query: string) => void
  searching: boolean
  searchInputRef?: React.RefObject<HTMLInputElement>
  onSearchFocus?: () => void
  selectedType: AssetType | null
  onTypeSelect: (type: AssetType | null) => void
  showUnusedOnly: boolean
  onUnusedFilterToggle: () => void
  showDuplicatesOnly: boolean
  onDuplicatesFilterToggle: () => void
  stats?: {
    images: number
    videos: number
    audio: number
    documents: number
    fonts: number
    data: number
    text: number
    other: number
    unused: number
    duplicateFiles: number
  }
}

const statusConfig: Record<SSEConnectionStatus, { dotClass: string; label: string }> = {
  connecting: {
    dotClass: 'bg-status-warning animate-pulse',
    label: 'Connecting...'
  },
  connected: {
    dotClass: 'bg-status-success',
    label: 'Watching'
  },
  reconnecting: {
    dotClass: 'bg-status-warning animate-pulse',
    label: 'Reconnecting...'
  },
  disconnected: {
    dotClass: 'bg-muted-foreground',
    label: 'Disconnected'
  }
}

export const Sidebar = memo(function Sidebar({
  total,
  searchQuery,
  onSearchChange,
  searching,
  searchInputRef,
  onSearchFocus,
  selectedType,
  onTypeSelect,
  showUnusedOnly,
  onUnusedFilterToggle,
  showDuplicatesOnly,
  onDuplicatesFilterToggle,
  stats
}: SidebarProps) {
  const { status } = useSSE()
  const { dotClass, label } = statusConfig[status]

  return (
    <aside className="w-full md:w-72 bg-sidebar border-r border-sidebar-border flex flex-col noise-bg h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <LightningIcon weight="fill" className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-semibold tracking-wide text-foreground">
              ASSET MANAGER
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider tabular-nums">
              {total} assets
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <SearchBar
          ref={searchInputRef}
          value={searchQuery}
          onChange={onSearchChange}
          searching={searching}
          onFocus={onSearchFocus}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Browse
        </div>
        <nav className="space-y-1">
          <NavItem
            icon={<PackageIcon weight="duotone" className="w-4 h-4" />}
            label="All Assets"
            count={total}
            active={selectedType === null}
            onClick={() => onTypeSelect(null)}
          />
          {stats && (
            <>
              <NavItem
                icon={<ImagesIcon weight="duotone" className="w-4 h-4" />}
                label="Images"
                count={stats.images}
                active={selectedType === 'image'}
                onClick={() => onTypeSelect('image')}
              />
              <NavItem
                icon={<VideoCameraIcon weight="duotone" className="w-4 h-4" />}
                label="Videos"
                count={stats.videos}
                active={selectedType === 'video'}
                onClick={() => onTypeSelect('video')}
              />
              <NavItem
                icon={<MusicNoteIcon weight="duotone" className="w-4 h-4" />}
                label="Audio"
                count={stats.audio}
                active={selectedType === 'audio'}
                onClick={() => onTypeSelect('audio')}
              />
              <NavItem
                icon={<FileTextIcon weight="duotone" className="w-4 h-4" />}
                label="Documents"
                count={stats.documents}
                active={selectedType === 'document'}
                onClick={() => onTypeSelect('document')}
              />
              <NavItem
                icon={<TextTIcon weight="duotone" className="w-4 h-4" />}
                label="Fonts"
                count={stats.fonts}
                active={selectedType === 'font'}
                onClick={() => onTypeSelect('font')}
              />
              <NavItem
                icon={<DatabaseIcon weight="duotone" className="w-4 h-4" />}
                label="Data"
                count={stats.data}
                active={selectedType === 'data'}
                onClick={() => onTypeSelect('data')}
              />
              <NavItem
                icon={<ArticleIcon weight="duotone" className="w-4 h-4" />}
                label="Text"
                count={stats.text}
                active={selectedType === 'text'}
                onClick={() => onTypeSelect('text')}
              />
              <NavItem
                icon={<FileIcon weight="duotone" className="w-4 h-4" />}
                label="Other"
                count={stats.other}
                active={selectedType === 'other'}
                onClick={() => onTypeSelect('other')}
              />
              <div className="mt-4 mb-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2">
                  Audit
                </div>
              </div>
              <NavItem
                icon={<WarningCircleIcon weight="duotone" className="w-4 h-4" />}
                label="Unused Assets"
                count={stats.unused}
                active={showUnusedOnly}
                onClick={onUnusedFilterToggle}
                countColor="warning"
              />
              <NavItem
                icon={<CopyIcon weight="duotone" className="w-4 h-4" />}
                label="Duplicates"
                count={stats.duplicateFiles}
                active={showDuplicatesOnly}
                onClick={onDuplicatesFilterToggle}
                countColor="info"
              />
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotClass}`} />
            <span className="font-mono">{label}</span>
          </div>
          <div className="flex relative items-center gap-2">
            <ModeToggle />
            <span className="font-mono opacity-50">v{packageJson.version}</span>
          </div>
        </div>
      </div>
    </aside>
  )
})

const countColorClasses: Record<string, string> = {
  warning: 'text-status-warning',
  info: 'text-status-info'
}

const NavItem = memo(function NavItem({
  icon,
  label,
  count,
  active = false,
  onClick,
  countColor
}: {
  icon: React.ReactNode
  label: string
  count: number
  active?: boolean
  onClick?: () => void
  countColor?: 'warning' | 'info'
}) {
  const countClass = active
    ? 'text-primary'
    : countColor && count > 0
      ? countColorClasses[countColor]
      : 'text-muted-foreground/60'

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 border
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background
        ${
          active
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span className={`ml-auto font-mono text-xs tabular-nums ${countClass}`}>
        {count}
      </span>
    </button>
  )
})
