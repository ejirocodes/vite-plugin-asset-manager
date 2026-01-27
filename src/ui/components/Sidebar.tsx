import { SearchBar } from './SearchBar'

interface SidebarProps {
  total: number
  searchQuery: string
  onSearchChange: (query: string) => void
  searching: boolean
}

export function Sidebar({ total, searchQuery, onSearchChange, searching }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-semibold text-slate-100">Asset Manager</span>
        </div>
      </div>

      <div className="p-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          searching={searching}
        />
      </div>

      <div className="px-4 py-2">
        <div className="text-sm text-slate-400">
          {total} assets in total
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        <nav className="space-y-1">
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700/50 text-slate-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            All Assets
          </a>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="w-5 h-5 bg-green-500 rounded-sm flex items-center justify-center text-white font-bold">V</span>
          <span>Vite Plugin</span>
        </div>
      </div>
    </aside>
  )
}
