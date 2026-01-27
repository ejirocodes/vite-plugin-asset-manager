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
  FileIcon
} from '@phosphor-icons/react'
import packageJson from '../../../package.json'

const colorClasses = {
  violet: 'text-violet-400 bg-violet-500/10',
  pink: 'text-pink-400 bg-pink-500/10',
  cyan: 'text-cyan-400 bg-cyan-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
  zinc: 'text-zinc-400 bg-zinc-500/10',
} as const

interface SidebarProps {
  total: number
  searchQuery: string
  onSearchChange: (query: string) => void
  searching: boolean
  stats?: {
    images: number
    videos: number
    audio: number
    documents: number
    fonts: number
    data: number
    text: number
    other: number
  }
}

export const Sidebar = memo(function Sidebar({ total, searchQuery, onSearchChange, searching, stats }: SidebarProps) {
  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col noise-bg">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <PackageIcon weight="bold" className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-sidebar" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-semibold tracking-wide text-foreground">
              ASSET MANAGER
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
              VITE PLUGIN
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          searching={searching}
        />
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-lg bg-card/50 border border-border p-4">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Assets
            </span>
            <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
              {total}
            </span>
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-2">
              <StatBadge
                icon={<ImagesIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Images"
                count={stats.images}
                color="violet"
              />
              <StatBadge
                icon={<VideoCameraIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Videos"
                count={stats.videos}
                color="pink"
              />
              <StatBadge
                icon={<MusicNoteIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Audio"
                count={stats.audio}
                color="cyan"
              />
              <StatBadge
                icon={<FileTextIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Docs"
                count={stats.documents}
                color="amber"
              />
              <StatBadge
                icon={<TextTIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Fonts"
                count={stats.fonts}
                color="rose"
              />
              <StatBadge
                icon={<DatabaseIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Data"
                count={stats.data}
                color="emerald"
              />
              <StatBadge
                icon={<ArticleIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Text"
                count={stats.text}
                color="purple"
              />
              <StatBadge
                icon={<FileIcon weight="fill" className="w-3.5 h-3.5" />}
                label="Other"
                count={stats.other}
                color="zinc"
              />
            </div>
          )}
        </div>
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
            active
          />
          {stats && (
            <>
              <NavItem
                icon={<ImagesIcon weight="duotone" className="w-4 h-4" />}
                label="Images"
                count={stats.images}
              />
              <NavItem
                icon={<VideoCameraIcon weight="duotone" className="w-4 h-4" />}
                label="Videos"
                count={stats.videos}
              />
              <NavItem
                icon={<MusicNoteIcon weight="duotone" className="w-4 h-4" />}
                label="Audio"
                count={stats.audio}
              />
              <NavItem
                icon={<FileTextIcon weight="duotone" className="w-4 h-4" />}
                label="Documents"
                count={stats.documents}
              />
              <NavItem
                icon={<TextTIcon weight="duotone" className="w-4 h-4" />}
                label="Fonts"
                count={stats.fonts}
              />
              <NavItem
                icon={<DatabaseIcon weight="duotone" className="w-4 h-4" />}
                label="Data"
                count={stats.data}
              />
              <NavItem
                icon={<ArticleIcon weight="duotone" className="w-4 h-4" />}
                label="Text"
                count={stats.text}
              />
              <NavItem
                icon={<FileIcon weight="duotone" className="w-4 h-4" />}
                label="Other"
                count={stats.other}
              />
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Watching</span>
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

const StatBadge = memo(function StatBadge({
  icon,
  label,
  count,
  color
}: {
  icon: React.ReactNode
  label: string
  count: number
  color: keyof typeof colorClasses
}) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${colorClasses[color]}`}>
      {icon}
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono text-xs font-semibold tabular-nums">{count}</span>
    </div>
  )
})

// rerender-memo: Memoize to prevent re-renders when props unchanged
const NavItem = memo(function NavItem({
  icon,
  label,
  count,
  active = false
}: {
  icon: React.ReactNode
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all
        ${active
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
        }
      `}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span className={`
        ml-auto font-mono text-xs tabular-nums
        ${active ? 'text-primary' : 'text-muted-foreground/60'}
      `}>
        {count}
      </span>
    </button>
  )
})
