# Vite Plugin Asset Manager - Architecture & Design Decisions

## Overview
A Vite plugin that provides a visual dashboard for browsing assets in Vite projects (supports React, Vue, Svelte, Solid, Preact, Lit, Qwik, and vanilla JS), accessible at `/__asset_manager__` during development.

## Key Design Decisions

### 1. Plugin Architecture
- **Dev-only plugin**: Uses `apply: 'serve'` to run only during development
- **Middleware injection**: Uses `configureServer` hook to inject custom middleware before Vite's internal handlers
- **Pre-built UI**: React UI is compiled at build time and served as static files (not compiled at runtime)
- **Floating icon injection**: Uses `transformIndexHtml` hook to inject overlay button into host app HTML

### 2. Asset Scanner (`src/server/scanner.ts`)
- **fast-glob** chosen over native `fs.readdir` for performance on large codebases
- **In-memory cache**: Assets cached in a `Map<string, Asset>` after initial scan
- **Incremental updates**: Uses `chokidar` to watch for file changes and update cache incrementally (not full re-scan)
- **Event-driven**: Extends `EventEmitter` to notify plugin of changes for WebSocket updates

### 2a. Importer Scanner (`src/server/importer-scanner.ts`)
- Detects which source files import each asset
- **Source file extensions**: js, jsx, ts, tsx, vue, svelte, css, scss, less, html
- **Import patterns detected**:
  - ES imports: `import x from './asset.png'`
  - Dynamic imports: `import('./asset.png')`
  - CommonJS: `require('./asset.png')`
  - CSS url(): `url('./asset.png')`
  - HTML attributes: `src="./asset.png"`, `href="./asset.png"`
- **Reverse index**: Maps source files to asset paths for efficient updates
- **Real-time watching**: Watches source files and emits `change` events with affected assets
- **Batch processing**: Scans files in batches of 50 to avoid overwhelming I/O

### 2b. Editor Launcher (`src/server/editor-launcher.ts`)
- Opens files in configured editor at specific line/column
- Uses `launch-editor` package (supports 20+ editors)
- Configurable via `launchEditor` option (default: 'code' for VS Code)
- Supported editors: code, cursor, webstorm, idea, vim, emacs, sublime, atom, etc.

### 2c. Duplicate Scanner (`src/server/duplicate-scanner.ts`)
- Content-based duplicate detection using MD5 hashing
- **Hash computation**: MD5 of file contents, streaming for files >1MB
- **Two-tier cache**: hashCache (path -> {hash, mtime, size}) + duplicateGroups (hash -> Set<paths>)
- **Cache validation**: Reuses hash if mtime and size unchanged
- **Batch processing**: Processes 20 assets at a time to avoid I/O overload
- **Real-time watching**: Watches asset files and emits `change` events with affected hashes
- **Reverse index**: pathToHash map for quick lookups
- **API**: getDuplicateInfo(path), getDuplicatesByHash(hash), enrichAssetsWithDuplicateInfo(assets)

### 2d. File Revealer (`src/server/file-revealer.ts`)
- Cross-platform utility to reveal files in system file explorer
- **macOS**: Uses `open -R` command (reveals in Finder)
- **Windows**: Uses `explorer /select,` command (reveals in Explorer)
- **Linux**: Uses `xdg-open` to open parent directory
- Returns Promise that resolves on success or rejects with error

### 2e. Floating Icon Component (`src/client/floating-icon/`)
Framework-agnostic overlay button that opens the Asset Manager panel. Built as self-executing IIFE, injectable into any Vite app.

**Architecture** (8 files):
- **index.ts**: Entry point with `initFloatingIcon()` function and auto-initialization
- **constants.ts**: Z-index values (99998-100000), dimensions, colors, drag thresholds (5px)
- **dom.ts**: DOM element creation and manipulation
  - 5 elements: container, trigger button, overlay, panel, iframe
  - Functions: `createElements()`, `mountElements()`, `unmountElements()`, `applyPosition()`, `updatePanelState()`
- **state.ts**: Composable-style state managers
  - `createPositionState()` - Position (left/right edge, vertical offset, localStorage)
  - `createPanelState()` - Panel open/closed state (localStorage)
  - `createDragState()` - Drag state for click vs drag detection
- **events.ts**: Event handler setup
  - Drag handlers: Pointer events with 5px threshold, momentum-based edge snapping
  - Click handlers: Distinguishes drag from click, triggers panel toggle
  - Keyboard handlers: Escape to close, Option+Shift+A to toggle
- **styles.ts**: CSS injection with CSS variables, responsive design, backdrop blur
- **icons.ts**: Embedded Vite gradient SVG icon (VITE_ICON constant)
- **tsconfig.json**: ES2020 target with DOM libs

**Build Configuration** (`vite.config.floating-icon.ts`):
- Format: IIFE (self-executing)
- Output: `dist/client/floating-icon.js`
- Options: `emptyOutDir: false` (preserves UI build), `inlineDynamicImports: true`
- Build command: `pnpm run build:floating-icon`

**Plugin Integration** (`src/plugin.ts`):
- Injects via `transformIndexHtml()` hook when `floatingIcon: true`
- Two script tags injected into HTML body:
  1. Inline script: Sets `window.__VAM_BASE_URL__` with base path
  2. Module script: Loads `floating-icon.js` from base URL
- Auto-initialization: Triggered when `__VAM_BASE_URL__` global exists

**Features**:
- Draggable with momentum-based edge snapping
- localStorage persistence (position + panel state)
- Keyboard shortcuts (⌥⇧A toggle, Escape close)
- Modal overlay with backdrop blur
- Cursor feedback (grab/grabbing)
- Cross-browser (Pointer Events API)
- Framework-agnostic (no dependencies)

**State Management Pattern**:
- Composable-style inspired by Vue DevTools
- Separate state managers for position, panel, drag
- Getter/setter pattern with localStorage sync

### 3. Thumbnail Service (`src/server/thumbnail.ts`)
- **Sharp** for image processing (faster than ImageMagick, pure JS alternatives)
- **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.tiff`
- **HEIC/HEIF**: Requires libheif support in Sharp (may not generate thumbnails without it)
- **Two-tier cache**: Memory cache (fast) + disk cache in `os.tmpdir()` (persistent)
- **Cache key**: MD5 hash of `absolutePath + size + mtime` for invalidation
- **SVGs served directly**: No thumbnail generation needed (already lightweight/scalable)

### 4. API Design
| Endpoint | Purpose |
|----------|---------|
| `GET /api/assets` | List all assets (filterable by directory/type) |
| `GET /api/assets/grouped` | Assets grouped by directory (supports: `?type=`, `?minSize=`, `?maxSize=`, `?minDate=`, `?maxDate=`, `?extensions=`) |
| `GET /api/search?q=` | Search by name/path (supports same filter params as /assets/grouped) |
| `GET /api/thumbnail?path=` | Get image thumbnail |
| `GET /api/file?path=` | Serve original file |
| `GET /api/stats` | Asset statistics (includes unused and duplicate counts) |
| `GET /api/importers?path=` | Get files that import the asset |
| `GET /api/duplicates?hash=` | Get all assets with matching content hash |
| `POST /api/open-in-editor?file=&line=&column=` | Open file in editor |
| `POST /api/reveal-in-finder?path=` | Reveal file in system explorer (macOS/Windows/Linux) |
| `POST /api/bulk-download` | Download multiple assets as ZIP (body: `{paths: string[]}`) |
| `POST /api/bulk-delete` | Delete multiple assets (body: `{paths: string[]}`) |
| `GET /api/events` | SSE endpoint for real-time updates |

### 5. Security Considerations
- **Path traversal prevention**: All paths validated with `absolutePath.startsWith(root)`
- **Dev-only**: Never runs in production builds
- **Excluded directories**: `node_modules`, `.git`, `dist`, `.cache`, `coverage`

### 6. UI Architecture
- **React + Tailwind CSS v4**: Pre-built and bundled in `dist/client/`
- **shadcn/ui (base-mira style)**: Using Phosphor icons
- **Sonner**: Toast notifications for copy feedback
- **Dark theme by default**: Matches typical dev tool aesthetics
- **Real-time updates**: Uses SSE (Server-Sent Events) via `/api/events` endpoint with shared singleton EventSource connection (`useSSE` hook)
- **Debounced search**: 200ms debounce to avoid excessive API calls

### 6a. Preview Panel Architecture
The preview panel is a fixed sidebar (not a Sheet/Dialog) with 13 total component files:
- **Custom resize logic**: Drag left edge to resize (MIN: 300px, MAX: 600px, DEFAULT: 384px)
- **Root components** (7 files in `preview-panel/`):
  - `index.tsx` - Main panel with resize logic
  - `preview-section.tsx` - Preview content dispatcher
  - `details-section.tsx` - Asset metadata display
  - `actions-section.tsx` - Action buttons
  - `code-snippets.tsx` - Import code snippets
  - `importers-section.tsx` - Shows files that import the asset
  - `duplicates-section.tsx` - Shows other files with identical content
- **Type-specific renderers** (6 files in `preview-panel/renderers/`):
  - `image-preview.tsx` - Image display with dimension detection
  - `video-preview.tsx` - HTML5 video player
  - `audio-preview.tsx` - Audio player
  - `font-preview.tsx` - Font preview with sample text and character set
  - `code-preview.tsx` - Syntax highlighting for data/text files
  - `fallback-preview.tsx` - Generic file icon display
- **Details displayed**: Filepath, public path, type, image dimensions, aspect ratio, file size, last modified
- **Importers section**: Shows files that import the asset with clickable links to open in editor at exact line/column
- **Duplicates section**: Shows other files with same content hash, clickable to switch preview

### 6b. Card Preview Components (`src/ui/components/card-previews/`)
- **Font cards**: Display font preview directly on the card
- **Video cards**: Display video thumbnail/preview on the card

### 6c. Sorting System
- **Sort utilities**: `src/ui/lib/sort-utils.ts` - Defines sort fields, directions, and sorting logic
- **Sort controls**: `src/ui/components/sort-controls.tsx` - Dropdown UI for selecting sort options
- **Sort fields**: name, size, mtime (date modified), type
- **Sort directions**: ascending (asc), descending (desc)
- **8 sort options**: Name A→Z, Name Z→A, Size Smallest/Largest, Date Newest/Oldest, Type A→Z/Z→A
- Sorting applied per directory group in `App.tsx`

### 6d. Type Filtering
- **Sidebar integration**: `side-bar.tsx` accepts `selectedType` and `onTypeSelect` props
- **State management**: `App.tsx` manages `selectedType` state
- **Hook support**: `useAssets` accepts `typeFilter` parameter, constructs URL with `?type=` query
- **9 filter options**: All Assets + 8 specific types (image, video, audio, document, font, data, text, other)

### 6e. Bulk Operations System
- **Hook**: `useBulkOperations.ts` - Handles bulk delete operations
- **Component**: `bulk-actions-bar.tsx` - Sticky action bar with select controls and action buttons
- **Selection state**: Managed in `App.tsx` with `selectedAssets` (Set<string>) and `lastSelectedId`
- **Selection modes**:
  - Single click: Toggle selection
  - Shift+click: Range selection from last selected
  - Ctrl/Cmd+click: Toggle without deselecting others
- **Actions**:
  - Select all / Deselect all
  - Copy paths to clipboard (newline-separated)
  - Bulk download as ZIP (using archiver package)
  - Bulk delete with confirmation dialog
- **API endpoints**: `/bulk-download` (POST), `/bulk-delete` (POST)

### 6f. Unused Asset Detection
- **Data source**: `Asset.importersCount` field populated by importer-scanner
- **Stats tracking**: `AssetStats.unused` field in `/stats` endpoint
- **Hook**: `useStats.ts` - Fetches stats including unused count
- **Filtering**: `showUnusedOnly` state in `App.tsx` filters assets where `importersCount === 0`
- **UI indicators**: Badge on asset cards showing "Unused" status
- **Sidebar filter**: "Unused Assets" option to show only unused

### 6g. Ignored Assets System
- **Provider**: `ignored-assets-provider.tsx` - Context provider managing ignored state
- **Storage**: localStorage key `vite-asset-manager-ignored-assets` (JSON array of paths)
- **Hook**: `useIgnoredAssets()` - Returns `{ ignoredPaths, isIgnored, addIgnored, removeIgnored, toggleIgnored, clearAll }`
- **Filtering**: Ignored assets are filtered out at App level (not sent to server)
- **Persistence**: Survives page reloads, stored per-browser
- **Integration**: Works with all filters (type, unused, search, sort)

### 6h. Context Menu System
- **Hook**: `useAssetActions.ts` - Centralized action handlers for 7 actions (preview, copy path, copy code, editor, reveal, ignore, delete)
- **Component**: `asset-context-menu.tsx` - Right-click menu with 5 groups of actions
- **Trigger**: Right-click on asset card (auto-selects if not already selected)
- **Actions**:
  1. Open Preview - Opens preview panel
  2. Copy Path - Copies to clipboard with toast feedback
  3. Copy Import Code - Submenu with HTML/React/Vue snippets
  4. Open in Editor - Uses first importer location (disabled if no importers)
  5. Reveal in Finder/Explorer - Platform-specific file reveal
  6. Toggle Ignore - Mark/unmark as ignored (only for unused assets)
  7. Delete - Bulk delete with confirmation
- **Server support**: `/reveal-in-finder` endpoint + `file-revealer.ts` utility
- **Design**: Phosphor bold icons, keyboard shortcuts display, checkmark feedback, destructive variant for delete
- **Integration**: Wrapped around AssetCard, preserves all existing interactions

### 6i. Keyboard Navigation System
- **Hook**: `useKeyboardNavigation.ts` - Centralized keyboard event handler
- **Integration**: Called from `App.tsx` with full state access
- **Navigation shortcuts**:
  - Arrow keys - Grid-aware navigation (calculates columns based on viewport)
  - `j`/`k` - Vim-style up/down navigation
  - `Tab`/`Shift+Tab` - Cycle focus through assets
- **Focus shortcuts**:
  - `/` - Focus search input
  - `Escape` - Close preview panel or blur search
- **Selection shortcuts**:
  - `Space` - Toggle selection on focused asset
  - `Enter` - Open preview for focused asset
  - `Cmd/Ctrl+A` - Select all visible assets
  - `Cmd/Ctrl+D` - Deselect all
- **Action shortcuts**:
  - `Delete`/`Backspace` - Delete selected/focused assets
  - `Cmd/Ctrl+C` - Copy paths to clipboard
  - `Cmd/Ctrl+O` - Open in editor (single asset)
  - `Cmd/Ctrl+Shift+R` - Reveal in Finder/Explorer (single asset)
- **Features**:
  - Grid-aware column calculation (responsive to viewport width)
  - Platform-aware modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
  - Respects input field focus (disabled when typing)
  - Works with both selection and focus states

### 6j. Advanced Filters System
- **Hook**: `useAdvancedFilters.ts` - Manages size, date, and extension filters
- **Component**: `advanced-filters.tsx` - Dropdown UI with three filter sections
- **Filter types**:
  - Size: 4 presets (small/medium/large/xlarge) mapped to byte ranges
  - Date: 5 presets (today/last7days/last30days/last90days/thisYear) converted to timestamps
  - Extensions: Multi-select from available extensions in current asset set
- **State management**:
  - Individual state for each filter type
  - Active count computed from all filter states
  - Returns `filterParamsString` (primitive string) for stable dependencies (Vercel best practice)
- **UI features**:
  - Badge showing active filter count
  - Visual feedback with checkmarks on selected filters
  - "Clear all" button in footer when filters are active
  - Organized sections with icons (Database, Calendar, File)
  - Filter chips for size, pills for date/extensions
- **API integration**: Converts filters to query params (`minSize`, `maxSize`, `minDate`, `maxDate`, `extensions`)

### 6k. Duplicates Section in Preview Panel
- **Component**: `duplicates-section.tsx` - Shows other files with same content hash
- **Location**: Preview panel, below importers section
- **Features**:
  - Lists all duplicate files (excluding current asset)
  - Shows file name, size, and directory
  - Click to switch preview to that duplicate
  - Loading state while fetching duplicates
- **Hook**: Uses `useDuplicates(contentHash)` to fetch duplicate assets

### 7. Build Strategy
- **tsup** for plugin (Node.js, ESM + CJS, generates `.d.ts`)
- **Vite** for UI (React, outputs to `dist/client/`)
- **Build order**: UI first, then plugin (critical - see gotchas)

## Build Gotchas

### tsup `clean: false` is required
The plugin build must use `clean: false` in tsup.config.ts. If `clean: true`, tsup wipes the entire `dist/` folder including `dist/client/` (the UI build output) before building the plugin.

### Client path resolution (`findClientDir`)
The middleware in `src/server/index.ts` uses `findClientDir()` to locate the pre-built UI files. This handles two scenarios:
1. **From built dist**: `__dirname` is `dist/`, client at `dist/client/`
2. **From source** (e.g., playground): `__dirname` is `src/server/`, client at `dist/client/`

```typescript
function findClientDir(): string {
  const fromDist = path.join(__dirname, '../client')
  if (fs.existsSync(fromDist)) return fromDist

  const fromSource = path.resolve(__dirname, '../../dist/client')
  if (fs.existsSync(fromSource)) return fromSource

  return fromDist // fallback
}
```

**If UI doesn't load**: Run `pnpm run build:ui` first to ensure `dist/client/` exists.

## File Type Classification (8 categories)
```typescript
// AssetType = 'image' | 'video' | 'audio' | 'document' | 'font' | 'data' | 'text' | 'other'
const types = {
  image: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico', '.bmp', '.tiff', '.tif', '.heic', '.heif'],
  video: ['.mp4', '.webm', '.ogg', '.mov', '.avi'],
  audio: ['.mp3', '.wav', '.flac', '.aac'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  font: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
  data: ['.json', '.csv', '.xml', '.yml', '.yaml', '.toml'],
  text: ['.md', '.txt'],
  other: [...] // fallback for unrecognized extensions
}
```

### UI Category Display
Each category has a distinct color in the sidebar:
- **image**: violet | **video**: pink | **audio**: cyan | **document**: amber
- **font**: rose | **data**: emerald | **text**: purple | **other**: zinc

### 8. Real-Time Updates (SSE)
The plugin uses Server-Sent Events for real-time updates instead of WebSocket:

**Server side** (`src/server/api.ts`):
- `sseClients` - Set of active SSE connections
- `handleSSE()` - Sets up SSE response headers and adds client to set
- `broadcastSSE(event, data)` - Sends events to all connected clients

**Client side** (`src/ui/hooks/useSSE.ts`):
- Shared singleton `EventSource` connection for efficiency
- Automatic reconnection with exponential backoff (max 10 attempts)
- Reference counting to manage connection lifecycle
- `subscribe(event, handler)` - Subscribe to specific event types

**Event flow**:
1. Scanner detects file change → emits event
2. Plugin calls `broadcastSSE('asset-manager:update', data)` or `broadcastSSE('asset-manager:importers-update', data)`
3. UI receives event via EventSource → triggers refetch

**SSE Events**:
- `asset-manager:update` - Sent when assets change (add/modify/delete). Used by `useAssets` hook.
- `asset-manager:importers-update` - Sent when source files change. Contains `affectedAssets` array. Used by `useImporters` hook.
- `asset-manager:duplicates-update` - Sent when duplicate status changes. Contains `affectedHashes` array. Used by `useDuplicates` hook.

**Why SSE over WebSocket**:
- Simpler server implementation (no ws dependency)
- Works through standard HTTP (better proxy compatibility)
- Sufficient for one-way server→client updates
- Automatic reconnection built into EventSource API

## Dependencies Rationale
| Package | Why |
|---------|-----|
| `fast-glob` | 10x faster than native fs for pattern matching |
| `chokidar` | Cross-platform file watching with debouncing |
| `sharp` | Fastest image processing in Node.js ecosystem |
| `sirv` | Lightweight static file server (smaller than express.static) |
| `launch-editor` | Cross-platform editor launching with line/column support |
| `archiver` | ZIP file creation for bulk downloads |
| `@tanstack/react-virtual` | High-performance virtual scrolling for large lists |

## Development Tools

### Agent Skills
The project includes Claude Code agent skills for enhanced development workflows:
- `.agents/skills/` - Contains agent skill definitions
- `.claude/skills/` - Symlinks to agent skills (frontend-design, vercel-react-best-practices, web-design-guidelines)

These skills provide specialized assistance for UI development, React/Next.js optimization, and web accessibility.

## Configuration Options
```typescript
interface AssetManagerOptions {
  base?: string           // Default: '/__asset_manager__'
  include?: string[]      // Default: ['src', 'public']
  exclude?: string[]      // Default: ['node_modules', '.git', 'dist', '.cache', 'coverage']
  extensions?: string[]   // Customizable file extensions
  thumbnails?: boolean    // Default: true
  thumbnailSize?: number  // Default: 200px
  watch?: boolean         // Default: true (real-time updates)
  floatingIcon?: boolean  // Default: true (injects overlay button into host app)
  launchEditor?: EditorType // Default: 'code' (VS Code) - editor for "Open in Editor" feature
}

// EditorType supports: 'code' | 'cursor' | 'webstorm' | 'idea' | 'vim' | 'emacs' | 'sublime' | 'atom' | etc.
```

## Floating Icon System (`src/client/floating-icon/`)

Framework-agnostic overlay button providing quick access to the Asset Manager dashboard.

### Architecture (8 files)
- **`index.ts`** - Entry point with `initFloatingIcon()` and auto-initialization
- **`constants.ts`** - Configuration constants
  - Z-index layers: 99998-100000
  - Resize constraints: MIN_WIDTH=400px, MIN_HEIGHT=300px
  - VIEWPORT_MARGIN=20px (prevents panel going off-screen)
  - Drag threshold: 5px
  - Light/dark color schemes
- **`dom.ts`** - DOM element creation and manipulation
  - 5 base elements: container, trigger button, overlay, panel, iframe
  - Contextual resize handles based on trigger edge position
  - Functions: `createResizeHandles()`, `updatePanelSize()`, `constrainSize()`
- **`state.ts`** - Composable-style state managers (Vue DevTools pattern)
  - `createPositionState()` - Trigger position (left/right/top/bottom edge + offset)
  - `createPanelState()` - Panel open/closed state
  - `createDragState()` - Drag interaction state
  - `createSizeState()` - Panel dimensions (width/height)
  - All persist to localStorage with JSON serialization
- **`events.ts`** - Event handler setup
  - Pointer events for drag (5px threshold to distinguish from clicks)
  - Momentum-based edge snapping to all 4 edges
  - Resize handlers with min/max constraints
  - Double-click on resize handles to reset size
  - Keyboard: Escape to close, Option+Shift+A to toggle
- **`styles.ts`** - CSS injection
  - CSS variables for theming
  - `@media (prefers-color-scheme: dark)` for automatic theme switching
  - Backdrop blur, drop-shadow effects
  - Resize handle cursors: `ew-resize`, `ns-resize`, `nwse-resize`, `nesw-resize`
- **`icons.ts`** - Embedded Vite gradient SVG icon
- **`tsconfig.json`** - TypeScript config targeting ES2020 with DOM libs

### Features
- **Positioning**: Snaps to all 4 edges (left, right, top, bottom) with momentum-based detection
- **Resizing**: Drag handles on panel edges/corners with min/max constraints
  - MIN_WIDTH: 400px, MIN_HEIGHT: 300px
  - Double-click handles to reset to default size
  - Animation frame throttling for smooth resizing
- **Theming**: Automatic light/dark mode based on system preferences
  - Light colors: Light gray backgrounds, subtle shadows
  - Dark colors: Dark gray backgrounds, stronger shadows
- **Persistence**: 3 localStorage keys
  - `vite-asset-manager-position` - Trigger button position
  - `vite-asset-manager-open` - Panel open/closed state
  - `vite-asset-manager-size` - Panel dimensions
- **Interactions**:
  - Drag trigger button with 5px threshold (prevents accidental drags)
  - Click trigger to toggle panel
  - Keyboard shortcuts (⌥⇧A to toggle, Escape to close)
  - Resize handles appear contextually based on trigger edge
- **Integration**: Injected via `transformIndexHtml()` hook in `src/plugin.ts`
  - Sets `window.__VAM_BASE_URL__` global variable
  - Loads floating-icon.js as module script
  - Auto-initializes when global variable detected

### Build Process
- **Config**: `vite.config.floating-icon.ts`
- **Format**: IIFE (self-executing) with `emptyOutDir: false` to preserve UI build
- **Output**: `dist/client/floating-icon.js` (minified with esbuild)
- **Build order**: `build:ui` → `build:floating-icon` → `build:plugin`

## Future Considerations / In Progress

### Completed
- ~~**Importers tracking**~~ ✓ Implemented - Shows which files import each asset with click-to-open-in-editor
- ~~Copy import path to clipboard~~ ✓ Implemented via CodeSnippets section
- ~~Open in Editor~~ ✓ Implemented - Opens importing files at exact line/column
- ~~SSE Real-Time Updates~~ ✓ Implemented - Replaced WebSocket with Server-Sent Events
- ~~Sidebar Type Filtering~~ ✓ Implemented - Filter by asset type from sidebar
- ~~Asset Sorting~~ ✓ Implemented - 8 sort options via dropdown
- ~~Test Infrastructure~~ ✓ Implemented - 14 test files (6 server + 8 UI)
- ~~Bulk Operations~~ ✓ Implemented - Multi-select, copy paths, download ZIP, bulk delete
- ~~Unused Asset Detection~~ ✓ Implemented - Badge on cards, sidebar filter, stats tracking
- ~~Ignored Assets~~ ✓ Implemented - localStorage-persisted hiding without deletion
- ~~Context Menu~~ ✓ Implemented - Right-click menu with 7 actions, platform-specific file reveal
- ~~Duplicate Detection~~ ✓ Implemented - MD5 content hashing with streaming, duplicate count badges, real-time updates
- ~~Keyboard Navigation~~ ✓ Implemented - Full keyboard support with arrow keys, vim bindings, shortcuts for all actions
- ~~Advanced Filters~~ ✓ Implemented - Filter by size (4 presets), date modified (5 presets), and file extension (multi-select)
- ~~Virtual Scrolling~~ ✓ Implemented - Row-based virtualization with @tanstack/react-virtual for large asset collections
- ~~Performance Optimizations~~ ✓ Implemented - Vercel React best practices (primitive deps, stable callbacks, single-pass filtering)

### Planned
- Drag-and-drop upload
- Asset optimization suggestions (oversized images)
- Custom date/size ranges (currently presets only)
- Image dimension filtering

### 6l. Virtual Scrolling System
- **Library**: `@tanstack/react-virtual` for row-based virtualization
- **Hooks**:
  - `useResponsiveColumns.ts` - Calculates grid columns based on viewport width (mirrors Tailwind breakpoints)
  - `useVirtualGrid.ts` - Wraps `useVirtualizer` for grid-based row virtualization
- **Component**: `asset-grid.tsx` - Refactored to use virtual rendering
- **Architecture**:
  - Fixed row height (244px = 200px card + 44px footer)
  - Gap: 16px between cards
  - Overscan: 2 rows buffer for smooth scrolling
  - Absolute positioning with `translateY()` for visible rows
  - Total height set on wrapper for proper scrollbar
- **Responsive breakpoints**:
  - 6 columns: ≥1536px (2xl)
  - 5 columns: ≥1280px (xl)
  - 4 columns: ≥1024px (lg)
  - 3 columns: ≥768px (md)
  - 2 columns: ≥640px (sm)
  - 1 column: default
- **Scroll management**:
  - `scrollContainerRef` passed from `App.tsx` (main element)
  - `scrollToItem()` keeps focused asset visible during keyboard navigation
- **Benefits**: Handles 100+ assets without DOM bloat, maintains all interactions (selection, context menu, preview)

### 6m. Performance Optimizations (Vercel Best Practices)
- **File**: `.claude/REFACTORING_SUMMARY.md` - Detailed documentation
- **Applied optimizations**:
  1. **rendering-hoist-jsx**: Static components (`LoadingSpinner`, `EmptyState`) hoisted outside render
  2. **rerender-dependencies**: Primitive string dependencies instead of objects in hooks
  3. **rerender-memo**: Single-pass filtering in `displayGroups` computation
  4. **rerender-use-ref-transient-values**: Stable `isIgnored` callback using ref
  5. **js-combine-iterations**: Multiple iterations merged into single loops
  6. **js-cache-property-access**: Property lookups cached in sort comparisons
  7. **rerender-functional-setstate**: Documented existing functional setState patterns
- **Files modified**: App.tsx, useAdvancedFilters.ts, useAssets.ts, useSearch.ts, ignored-assets-provider.tsx, asset-card.tsx, sort-utils.ts
- **Impact**: Reduced re-renders, stable hook execution, O(n) instead of O(2n) filtering

## UI Component Library
Key shadcn/ui components in use (19 total):
- `button.tsx` - Button variants (ghost, outline, etc.)
- `card.tsx` - Card container
- `input.tsx` - Input fields
- `badge.tsx` - Status badges
- `separator.tsx` - Visual separators
- `tabs.tsx` - Tab navigation
- `dropdown-menu.tsx` - Dropdown menus (used in filters and sort controls)
- `context-menu.tsx` - Right-click context menus (used in asset cards)
- `alert-dialog.tsx` - Confirmation dialogs (used in bulk delete)
- `sonner.tsx` - Toast notifications
- `resizable.tsx` - Resizable panels (from react-resizable-panels)
- `combobox.tsx` - Searchable select
- `select.tsx` - Basic select
- `checkbox.tsx` - Checkbox input (used in bulk selection)
- `field.tsx`, `input-group.tsx`, `label.tsx` - Form components
- `sheet.tsx` - Slide-out panel
- `textarea.tsx` - Multi-line text input
