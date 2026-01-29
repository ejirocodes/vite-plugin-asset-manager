# Quick Reference

## Commands
```bash
# Build everything (UI + plugin)
pnpm run build

# Build UI only
pnpm run build:ui

# Build plugin only
pnpm run build:plugin

# Watch mode (plugin)
pnpm run dev

# Test in playground
cd playground && pnpm run dev
# Then visit: http://localhost:5173/__asset_manager__

# Testing (14 test files: 6 server + 8 UI)
pnpm run test          # Run all tests once
pnpm run test:watch    # Watch mode
pnpm run test:ui       # Vitest UI
pnpm run test:coverage # Coverage report
pnpm run test:server   # Server tests only (Node environment)
pnpm run test:client   # UI tests only (jsdom environment)
```

## Project Structure
```
src/
├── index.ts          # Entry point, exports plugin function
├── plugin.ts         # Vite plugin hooks (configureServer)
├── shared/types.ts   # Shared TypeScript types (Asset, Importer, EditorType, DuplicateInfo, etc.)
├── server/
│   ├── index.ts            # Middleware setup (sirv + API router)
│   ├── api.ts              # REST endpoints + SSE handling
│   ├── scanner.ts          # Asset discovery (fast-glob + chokidar)
│   ├── thumbnail.ts        # Image thumbnails (sharp)
│   ├── importer-scanner.ts # Detects which files import each asset
│   ├── duplicate-scanner.ts # Content-based duplicate detection (MD5 hashing)
│   ├── editor-launcher.ts  # Opens files in configured editor
│   └── file-revealer.ts    # Cross-platform file reveal utility
└── ui/               # React app (built separately)
    ├── App.tsx
    ├── main.tsx
    ├── types/index.ts  # UI-specific TypeScript types
    ├── components/
    │   ├── asset-card.tsx       # Individual asset display card
    │   ├── asset-card.test.tsx  # Tests for asset card
    │   ├── asset-context-menu.tsx # Right-click context menu for asset actions
    │   ├── asset-grid.tsx       # Grid layout for assets
    │   ├── bulk-actions-bar.tsx # Bulk operations action bar
    │   ├── advanced-filters.tsx # Advanced size/date/extension filters
    │   ├── file-icon.tsx        # Icon component for file types
    │   ├── mode-toggle.tsx      # Theme mode toggle
    │   ├── search-bar.tsx       # Search input component
    │   ├── search-bar.test.tsx  # Tests for search bar
    │   ├── side-bar.tsx         # Sidebar with stats and type filtering
    │   ├── sort-controls.tsx    # Sort dropdown component
    │   ├── card-previews/       # Card preview components
    │   │   ├── index.ts             # Exports
    │   │   ├── font-card-preview.tsx
    │   │   └── video-card-preview.tsx
    │   ├── preview-panel/    # Asset preview system
    │   │   ├── index.tsx           # Main panel with resize logic
    │   │   ├── preview-section.tsx # Preview content dispatcher
    │   │   ├── details-section.tsx # Asset metadata display
    │   │   ├── actions-section.tsx # Action buttons
    │   │   ├── code-snippets.tsx   # Import code snippets
    │   │   ├── importers-section.tsx # Shows which files import the asset
    │   │   ├── duplicates-section.tsx # Shows files with same content hash
    │   │   └── renderers/          # Type-specific previews
    │   │       ├── image-preview.tsx
    │   │       ├── video-preview.tsx
    │   │       ├── audio-preview.tsx
    │   │       ├── font-preview.tsx
    │   │       ├── code-preview.tsx
    │   │       └── fallback-preview.tsx
    │   └── ui/             # shadcn primitives (button, card, input, etc.)
    ├── hooks/
    │   ├── useAssets.ts        # Asset fetching and SSE subscription
    │   ├── useAssets.test.ts   # Tests
    │   ├── useAssetActions.ts  # Context menu action handlers
    │   ├── useAdvancedFilters.ts # Size/date/extension filtering
    │   ├── useBulkOperations.ts # Bulk delete operations
    │   ├── useDuplicates.ts    # Fetch duplicate assets by content hash
    │   ├── useDuplicates.test.ts # Tests
    │   ├── useKeyboardNavigation.ts # Full keyboard navigation support
    │   ├── useSearch.ts        # Debounced search
    │   ├── useSearch.test.ts   # Tests
    │   ├── useImporters.ts     # Fetch importers and open-in-editor action
    │   ├── useImporters.test.ts # Tests
    │   ├── useSSE.ts           # Shared SSE connection for real-time updates
    │   ├── useSSE.test.ts      # Tests
    │   ├── useStats.ts         # Fetch asset statistics with unused count
    │   ├── useResponsiveColumns.ts # Viewport-aware grid column calculation
    │   └── useVirtualGrid.ts   # Virtual scrolling with @tanstack/react-virtual
    ├── providers/
    │   ├── theme-provider.tsx
    │   ├── ignored-assets-provider.tsx      # Manages ignored assets (localStorage)
    │   └── ignored-assets-provider.test.tsx # Tests
    └── lib/
        ├── utils.ts        # Tailwind cn() utility
        ├── code-snippets.ts # Import code snippet generators
        └── sort-utils.ts   # Sorting logic and types

tests/
├── setup.ts          # Global test setup, mock utilities
├── setup-ui.ts       # UI test setup (jsdom, EventSource mock)
├── mocks/            # Test mocks for dependencies
│   ├── chokidar.ts
│   ├── fast-glob.ts
│   ├── fs.ts
│   ├── launch-editor.ts
│   └── sharp.ts
└── server/           # Server-side tests
    ├── scanner.test.ts
    ├── api.test.ts
    ├── thumbnail.test.ts
    ├── importer-scanner.test.ts
    ├── editor-launcher.test.ts
    └── duplicate-scanner.test.ts

.agents/
└── skills/           # Agent skill definitions

.claude/
├── reminder/         # Project documentation for Claude
│   ├── architecture.md
│   ├── features-roadmap.md
│   └── quick-reference.md
└── skills/           # Symlinks to agent skills
    ├── frontend-design -> ../../.agents/skills/frontend-design
    ├── vercel-react-best-practices -> ../../.agents/skills/vercel-react-best-practices
    └── web-design-guidelines -> ../../.agents/skills/web-design-guidelines
```

## Key Files to Modify

### Adding new asset types
Edit these files:
1. [src/shared/types.ts](src/shared/types.ts) - Add to `AssetType` union and `DEFAULT_OPTIONS.extensions`
2. [src/ui/types/index.ts](src/ui/types/index.ts) - Mirror the `AssetType` change
3. [src/server/scanner.ts](src/server/scanner.ts) - Update `getAssetType()` method
4. [src/ui/App.tsx](src/ui/App.tsx) - Add to `stats` computation
5. [src/ui/components/side-bar.tsx](src/ui/components/side-bar.tsx) - Add StatBadge and NavItem

Current categories (8): `image`, `video`, `audio`, `document`, `font`, `data`, `text`, `other`

### Adding new API endpoints
Edit [src/server/api.ts](src/server/api.ts):
- Add case to switch statement
- Create handler function

Current endpoints: `/assets`, `/assets/grouped`, `/search`, `/thumbnail`, `/file`, `/stats`, `/importers`, `/duplicates`, `/open-in-editor`, `/reveal-in-finder`, `/bulk-download`, `/bulk-delete`, `/events` (SSE)

### Changing thumbnail behavior
Edit [src/server/thumbnail.ts](src/server/thumbnail.ts):
- `supportedFormats` array (line 11) controls which formats get thumbnails
- `generateThumbnail()` method for Sharp options

### Adding new preview renderers
Edit [src/ui/components/preview-panel/](src/ui/components/preview-panel/):
- Add new renderer in `renderers/` directory (image, video, audio, font, code, fallback)
- Update `preview-section.tsx` to use the new renderer based on asset type
- Existing renderers: `image-preview.tsx`, `video-preview.tsx`, `audio-preview.tsx`, `font-preview.tsx`, `code-preview.tsx`, `fallback-preview.tsx`

### Modifying the preview panel
The preview panel uses custom resize logic (not a Sheet component):
- [src/ui/components/preview-panel/index.tsx](src/ui/components/preview-panel/index.tsx) - Main panel with resize state
- Constants: `MIN_WIDTH=300`, `MAX_WIDTH=600`, `DEFAULT_WIDTH=384`
- Resizing handled via mouse events (drag left edge)

### UI modifications
All in `src/ui/`:
- [components/asset-card.tsx](src/ui/components/asset-card.tsx) - individual asset display
- [components/asset-grid.tsx](src/ui/components/asset-grid.tsx) - grid layout
- [App.tsx](src/ui/App.tsx) - main layout and state

## API Testing
```bash
# Get stats
curl http://localhost:5173/__asset_manager__/api/stats

# Get grouped assets
curl http://localhost:5173/__asset_manager__/api/assets/grouped

# Search
curl "http://localhost:5173/__asset_manager__/api/search?q=logo"

# Get thumbnail
curl "http://localhost:5173/__asset_manager__/api/thumbnail?path=src/assets/logo.svg"

# Get importers for an asset
curl "http://localhost:5173/__asset_manager__/api/importers?path=src/assets/logo.svg"

# Get duplicate assets by content hash
curl "http://localhost:5173/__asset_manager__/api/duplicates?hash=abc123def456"

# Open file in editor (POST request)
curl -X POST "http://localhost:5173/__asset_manager__/api/open-in-editor?file=src/App.tsx&line=5&column=1"

# Reveal file in system explorer (POST request)
curl -X POST "http://localhost:5173/__asset_manager__/api/reveal-in-finder?path=src/assets/logo.svg"

# Bulk download as ZIP (POST request)
curl -X POST "http://localhost:5173/__asset_manager__/api/bulk-download" \
  -H "Content-Type: application/json" \
  -d '{"paths":["src/assets/logo.svg","public/favicon.ico"]}' \
  --output assets.zip

# Bulk delete (POST request)
curl -X POST "http://localhost:5173/__asset_manager__/api/bulk-delete" \
  -H "Content-Type: application/json" \
  -d '{"paths":["src/assets/old-logo.svg"]}'

# Connect to SSE stream for real-time updates
curl -N "http://localhost:5173/__asset_manager__/api/events"
```

## Publishing
```bash
pnpm run build
pnpm publish
```

## Playground Assets
The playground includes a variety of test assets:
- Images: `02.png`, `Avatar.png`, `logo.svg`, `favicon.svg`
- Fonts: `public/font/` directory
- Media files: `public/media/` directory
- Data files: `src/data/` directory
- React assets: `src/assets/` directory

## New Features Quick Reference

### Quick Actions Context Menu
- **Trigger**: Right-click any asset card
- **Actions**: 7 actions in 5 groups (Open Preview, Copy Path, Copy Import Code, Open in Editor, Reveal in Finder/Explorer, Mark as Ignored, Delete)
- **Auto-select**: Right-clicking unselected asset automatically selects it
- **Hook**: `useAssetActions()` from `@/ui/hooks/useAssetActions`
- **Component**: `<AssetContextMenu>` from `@/ui/components/asset-context-menu`
- **Server**: `/reveal-in-finder` endpoint + `file-revealer.ts` utility

### Bulk Operations
- **Select assets**: Click checkbox, or Shift+click for range, Ctrl/Cmd+click to toggle
- **Actions**: Copy paths, Download ZIP, Delete (with confirmation)
- **Bulk actions bar**: Appears when assets are selected (sticky at top)
- **Select all/Clear**: Buttons in action bar
- **Hook**: `useBulkOperations()` from `@/ui/hooks/useBulkOperations`
- **Component**: `<BulkActionsBar>` from `@/ui/components/bulk-actions-bar`

### Unused Asset Detection
- **Badge**: "Unused" badge appears on assets with no importers
- **Filter**: Sidebar has "Unused Assets" filter option
- **Stats**: Unused count tracked in stats display
- **Hook**: `useStats()` from `@/ui/hooks/useStats`
- **Data**: `Asset.importersCount === 0` indicates unused

### Ignored Assets
- **Purpose**: Hide assets locally without deleting them
- **Storage**: localStorage key `vite-asset-manager-ignored-assets`
- **Provider**: `<IgnoredAssetsProvider>` from `@/ui/providers/ignored-assets-provider`
- **Hook**: `useIgnoredAssets()` returns `{ ignoredPaths, isIgnored, addIgnored, removeIgnored, toggleIgnored, clearAll }`
- **Usage**: Right-click asset card to ignore/unignore (only for unused assets)
- **Persistence**: Survives page reloads

### Duplicate Detection
- **Purpose**: Identify files with identical content
- **Algorithm**: MD5 hash of file contents (streaming for >1MB files)
- **Hook**: `useDuplicates(contentHash)` returns `{ duplicates, loading, error }`
- **Server**: `DuplicateScanner` class handles hash computation and caching
- **Badge**: Asset cards show "X duplicates" badge when duplicatesCount > 0
- **API**: `/duplicates?hash=` returns all assets with matching hash
- **Real-time**: SSE event `asset-manager:duplicates-update` on hash changes
- **Cache**: Two-level (hash cache + duplicate groups), validated by mtime+size
- **Preview panel**: `<DuplicatesSection>` shows other files with same hash

### Keyboard Navigation
- **Purpose**: Full keyboard-driven navigation and actions
- **Hook**: `useKeyboardNavigation()` from `@/ui/hooks/useKeyboardNavigation`
- **Navigation shortcuts**:
  - `←` `↑` `→` `↓` - Navigate grid (grid-aware column calculation)
  - `j` / `k` - Vim-style up/down navigation
  - `Tab` / `Shift+Tab` - Cycle through assets
- **Focus shortcuts**:
  - `/` - Focus search input
  - `Escape` - Close preview or blur search
- **Selection shortcuts**:
  - `Space` - Toggle selection on focused asset
  - `Enter` - Open preview for focused asset
  - `Cmd/Ctrl+A` - Select all visible assets
  - `Cmd/Ctrl+D` - Deselect all
- **Action shortcuts**:
  - `Delete` / `Backspace` - Delete selected/focused assets
  - `Cmd/Ctrl+C` - Copy paths to clipboard
  - `Cmd/Ctrl+O` - Open in editor (single asset)
  - `Cmd/Ctrl+Shift+R` - Reveal in Finder/Explorer (single asset)
- **Features**: Platform-aware (Cmd on Mac, Ctrl on Windows/Linux), respects input focus

### Advanced Filters
- **Purpose**: Filter assets by size, date modified, and file extension
- **Hook**: `useAdvancedFilters()` from `@/ui/hooks/useAdvancedFilters`
- **Component**: `<AdvancedFilters>` from `@/ui/components/advanced-filters`
- **Filter types**:
  - **Size**: 4 presets (Small <100KB, Medium 100KB-1MB, Large 1-10MB, Extra Large >10MB)
  - **Date**: 5 presets (Today, Last 7/30/90 days, This year)
  - **Extensions**: Multi-select from available extensions in current assets
- **UI features**:
  - Dropdown button with active filter count badge
  - Visual feedback with checkmarks on selected filters
  - "Clear all" button when filters are active
  - Organized sections with icons (Database, Calendar, File)
- **API**: Converts to query params (`minSize`, `maxSize`, `minDate`, `maxDate`, `extensions`)
- **Performance**: Returns `filterParamsString` (primitive) for stable dependencies (Vercel best practice)

### Virtual Scrolling
- **Purpose**: Handle large asset collections (100+ assets) without DOM bloat
- **Library**: `@tanstack/react-virtual` for row-based virtualization
- **Hooks**:
  - `useVirtualGrid()` - Wraps virtualizer, returns `virtualRows`, `totalHeight`, `getRowItems`, `scrollToItem`
  - `useResponsiveColumns()` - Returns responsive column count based on viewport width
- **Component**: `<AssetGrid>` uses virtualization with `scrollContainerRef` prop
- **Row height**: Fixed 244px (200px card + 44px footer) with 16px gap
- **Overscan**: 2 rows buffer for smooth scrolling
- **Breakpoints**: 6 cols (≥1536px), 5 cols (≥1280px), 4 cols (≥1024px), 3 cols (≥768px), 2 cols (≥640px), 1 col (default)
- **Integration**: Keyboard navigation uses `scrollToItem()` to keep focused asset visible

### Performance Optimizations
- **Applied Vercel best practices** for React rendering optimization
- **Primitive dependencies**: Hooks use strings instead of objects to prevent re-renders
- **Stable callbacks**: `isIgnored` uses ref pattern for consistent identity
- **Single-pass filtering**: Combined iterations in `displayGroups` computation
- **Static JSX hoisting**: `LoadingSpinner`, `EmptyState` defined outside component
- **Details**: See `.claude/REFACTORING_SUMMARY.md`

## Troubleshooting

**Assets not showing up?**
- Check `include` option matches your directory structure
- Verify file extension is in `extensions` list

**Thumbnails not generating?**
- Only works for: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.tiff`
- `.heic`/`.heif` require libheif support in Sharp
- SVGs served directly (no thumbnail needed)
- Check Sharp is installed correctly

**Real-time updates not working?**
- Ensure `watch: true` in options (default)
- Check browser console for SSE/EventSource errors
- Verify `/api/events` endpoint is accessible

**UI shows main app instead of asset manager?**
- Run `pnpm run build:ui` to build the UI files to `dist/client/`
- Ensure `tsup.config.ts` has `clean: false` (prevents wiping UI build)
- Check that `dist/client/index.html` exists
