# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite Plugin Asset Manager is a visual asset management dashboard for Vite projects. It provides a real-time web UI that discovers, catalogues, and displays all media assets (images, videos, audio, documents, fonts, data files, text) with thumbnail generation and search capabilities.

- Node requirement: >=22
- Vite compatibility: >=5.0.0
- Package type: ESM module with CJS support
- Package manager: pnpm (workspace includes `playgrounds/*`)

## Vite Framework Support

- [x] Vanilla
- [x] Vue
- [x] React
- [ ] Preact
- [ ] Lit
- [ ] Svelte
- [ ] Solid
- [ ] Qwik

## Build Commands

```bash
pnpm install           # Install all deps (root + playground workspace)
pnpm run build         # Build both UI and plugin (runs build:ui then build:plugin)
pnpm run build:ui      # Build React dashboard using Vite → dist/client/
pnpm run build:plugin  # Build plugin using tsup → dist/index.js, dist/index.cjs
pnpm run dev           # Watch mode for plugin development using tsup
```

The build order matters: UI must build first to `dist/client/` so the plugin can embed it. The tsup config uses `clean: false` to preserve the UI build.

## Testing with the Playgrounds

The `playgrounds/` directory contains framework-specific demo projects:

- `playgrounds/react/` - Vite+React demo
- `playgrounds/vue/` - Vite+Vue demo
- `playgrounds/vanilla/` - Vite+Vanilla (no framework) demo

```bash
cd playgrounds/react
pnpm run dev           # Start dev server with asset manager at /__asset_manager__/

# Or from root:
pnpm run playground:react
pnpm run playground:vue
pnpm run playground:vanilla
```

Each playground imports the plugin directly from `../../src/index` (no pnpm link needed). They also include `vite-plugin-inspect` for debugging Vite internals.

**Keyboard shortcut**: Press `⌥⇧A` (Option+Shift+A) in the host app to toggle the asset manager panel. Press `Escape` to close.

## Architecture

### Three-Layer Structure

1. **Plugin Layer** (`src/index.ts`, `src/plugin.ts`)
   - Vite plugin entry point, only active in 'serve' mode
   - Provides virtual module `virtual:asset-manager-config` for build-time config
   - Broadcasts SSE events when assets/importers change via `broadcastSSE()`

2. **Server Layer** (`src/server/`)
   - `scanner.ts` - EventEmitter-based file scanner using fast-glob + chokidar for watching
   - `thumbnail.ts` - Sharp-based thumbnail generation with dual-tier caching (memory + disk in OS temp)
   - `importer-scanner.ts` - Detects which source files import each asset (ES imports, dynamic imports, require, CSS url, HTML attributes)
   - `duplicate-scanner.ts` - Content-based duplicate detection using MD5 hashing with streaming support for large files
   - `editor-launcher.ts` - Opens files in configured editor at specific line/column using launch-editor
   - `file-revealer.ts` - Cross-platform utility to reveal files in system file explorer (Finder/Explorer)
   - `api.ts` - HTTP API router with endpoints: `/assets`, `/assets/grouped`, `/search`, `/thumbnail`, `/file`, `/stats`, `/importers`, `/duplicates`, `/open-in-editor`, `/reveal-in-finder`, `/bulk-download`, `/bulk-delete`, `/events` (SSE)
   - `index.ts` - Middleware setup, serves API at `{base}/api/*` and dashboard UI via sirv

3. **UI Layer** (`src/ui/`)
   - Self-contained React dashboard with its own `tsconfig.json`
   - Uses Tailwind CSS v4 and shadcn/ui (base-mira style with Phosphor icons)
   - Structure:
     - `components/` - App components (Sidebar, SearchBar, AssetGrid, AssetCard, FileIcon, BulkActionsBar, SortControls, AssetContextMenu, AdvancedFilters)
     - `components/ui/` - shadcn primitives (Button, Card, Input, Sheet, Tabs, ContextMenu, etc.)
     - `components/card-previews/` - Card preview components (FontCardPreview, VideoCardPreview)
     - `components/preview-panel/` - Asset preview system with type-specific renderers
       - `index.tsx` - Main panel using Sheet component
       - `renderers/` - Type-specific previews (image, video, audio, font, code, fallback)
       - `details-section.tsx`, `actions-section.tsx`, `code-snippets.tsx` - Panel sections
       - `importers-section.tsx` - Shows files that import the asset with click-to-open-in-editor
       - `duplicates-section.tsx` - Shows other files with identical content hash
     - `hooks/` - `useAssets()` for fetching/subscriptions, `useSearch()` for debounced search, `useImporters()` for importer data and editor launch, `useSSE()` for real-time SSE connection, `useStats()` for asset statistics, `useBulkOperations()` for multi-asset actions, `useAssetActions()` for context menu actions, `useDuplicates()` for duplicate file queries, `useKeyboardNavigation()` for full keyboard navigation support, `useAdvancedFilters()` for size/date/extension filtering, `useResponsiveColumns()` for viewport-aware grid columns, `useVirtualGrid()` for virtualized rendering with @tanstack/react-virtual
     - `providers/theme-provider.tsx` - Theme context using next-themes
     - `providers/ignored-assets-provider.tsx` - Manages ignored assets (localStorage-persisted)
     - `lib/utils.ts` - Tailwind `cn()` utility, `lib/code-snippets.ts` - Import snippet generators
     - `styles/globals.css` - Tailwind entry point with CSS variables

### TypeScript Configuration

- Root `tsconfig.json` - Plugin code (excludes `src/ui/`), uses `@/*` → `./src/*` alias
- `src/ui/tsconfig.json` - Dashboard code with DOM libs, uses `@/*` → `./src/*` alias (baseUrl: `../..`)

### shadcn/ui Configuration (`components.json`)

All shadcn components install to `src/ui/`:
- UI components: `@/ui/components/ui/`
- Utils: `@/ui/lib/utils`
- Hooks: `@/ui/hooks/`

### Shared Types (`src/shared/types.ts`)

Key types: `Asset`, `AssetGroup`, `AssetType`, `AssetManagerOptions`, `ResolvedOptions`, `Importer`, `ImportType`, `EditorType`, `AssetStats`, `DuplicateInfo`, `SizeFilter`, `DateFilter`, `ExtensionFilter`, `AdvancedFilters`, `SizeFilterPreset`, `DateFilterPreset`

The `Asset` interface includes:
- `importersCount?: number` - tracks how many files import this asset (assets with 0 are considered unused)
- `contentHash?: string` - MD5 hash of file contents for duplicate detection
- `duplicatesCount?: number` - number of other files with identical content

The `AssetStats` interface includes:
- `extensionBreakdown?: Record<string, number>` - count of assets per file extension

Default plugin options:
- Base path: `/__asset_manager__`
- Include directories: `['src', 'public']`
- Exclude: `['node_modules', '.git', 'dist', '.cache', 'coverage']`
- Thumbnail size: 200px
- Floating icon: enabled (injects overlay button into host app)
- Watch mode: enabled (sends HMR updates on file changes)
- Launch editor: `'code'` (VS Code) - configurable for click-to-open-in-editor functionality

## Key Patterns

- **Asset IDs**: Base64url-encoded relative file paths (not UUIDs)
- **Debouncing**: File watching uses 100ms stabilization, search uses 200ms
- **Thumbnail caching**: Cache key combines file path hash + mtime + size; stored in `os.tmpdir()`
- **Path security**: All file operations validate paths against project root to prevent traversal
- **Virtual modules**: Config passed to UI via Vite's virtual module system
- **Path aliases**: Both plugin and UI use `@/*` → `./src/*`. For UI code, use `@/ui/*` paths (e.g., `@/ui/lib/utils`, `@/ui/components/ui/button`)
- **Real-time updates**: File changes emit `asset-manager:update` events via SSE (Server-Sent Events) at `/api/events` endpoint, using a shared singleton EventSource connection in the UI
- **External dependencies**: `sharp` is external in tsup config (system-level image processing)
- **Importer detection**: Uses regex-based scanning (not AST) for performance; detects ES imports, dynamic imports, require, CSS url(), HTML src/href
- **Editor integration**: Uses `launch-editor` package to open files at specific line/column; configurable via `launchEditor` option
- **Bulk operations**: Multi-select assets (Shift+click, Ctrl/Cmd+click), copy paths, download as ZIP, bulk delete with confirmation
- **Unused assets**: Assets with no importers are marked as unused; filter available in sidebar
- **Ignored assets**: Locally hide assets from view; persisted in localStorage (key: `vite-asset-manager-ignored-assets`)
- **Context menu**: Right-click asset cards for quick actions (preview, copy, reveal, delete, etc.)
- **Duplicate detection**: Content-based deduplication using MD5 hashing with streaming for large files; cached by mtime+size
- **Keyboard navigation**: Full keyboard support with arrow keys, vim-style `j`/`k`, and shortcuts for all actions (`useKeyboardNavigation` hook)
- **Virtual scrolling**: Uses `@tanstack/react-virtual` for row-based virtualization; renders only visible rows + 2 row buffer for smooth scrolling

## Testing

```bash
pnpm run test          # Run all tests once
pnpm run test:watch    # Watch mode
pnpm run test:ui       # Run with Vitest UI
pnpm run test:coverage # Run with coverage report
pnpm run test:server   # Run server tests only (Node environment)
pnpm run test:client   # Run UI tests only (jsdom environment)
```

### Test Structure

- `tests/server/` - Server-side tests (scanner, thumbnail, api, importer-scanner, editor-launcher, duplicate-scanner)
- `src/ui/**/*.test.{ts,tsx}` - UI component and hook tests (co-located)
- `tests/setup.ts` - Global test setup, exports `createMockAsset()` and `createMockImporter()` utilities
- `tests/setup-ui.ts` - UI-specific setup (jsdom), mocks for EventSource, fetch, clipboard

Environment selection: Server tests run in `node`, UI tests (matching `src/ui/**`) run in `jsdom` via `environmentMatchGlobs`.

## Linting & Formatting

```bash
pnpm run lint          # Check for ESLint errors
pnpm run lint:fix      # Auto-fix ESLint errors
pnpm run format        # Format code with Prettier
pnpm run format:check  # Check formatting without changes
```

ESLint uses flat config (`eslint.config.js`) with separate rules for plugin code (Node/TS) and UI code (React/TSX).

## Recent Features (Latest Updates)

### Bulk Operations
Multi-select assets for batch actions:
- **Selection methods**: Click checkbox, Shift+click (range), Ctrl/Cmd+click (toggle)
- **Actions**: Copy paths to clipboard, download as ZIP, bulk delete with confirmation
- **UI**: Sticky action bar appears at top when assets are selected
- **Implementation**: `useBulkOperations` hook, `BulkActionsBar` component
- **API endpoints**: `/bulk-download` (POST), `/bulk-delete` (POST)

### Unused Asset Detection
Identify assets not imported anywhere in your codebase:
- **Badge indicator**: "Unused" badge on asset cards
- **Sidebar filter**: "Unused Assets" option to show only unused
- **Stats tracking**: Unused count in sidebar stats display
- **Implementation**: `Asset.importersCount` field, `useStats` hook
- **Integration**: Works with importer scanner to track usage

### Ignored Assets
Hide assets locally without deleting them:
- **Storage**: localStorage-persisted (key: `vite-asset-manager-ignored-assets`)
- **Provider**: `IgnoredAssetsProvider` wraps app
- **Hook**: `useIgnoredAssets()` for state management
- **Integration**: Filtered at app level, works with all other filters
- **Use cases**: Hide generated assets, vendor files, or work-in-progress assets

### Quick Actions Context Menu
Right-click context menu for fast asset actions:
- **Trigger**: Right-click any asset card (auto-selects if not already selected)
- **Actions**: 7 total actions in 5 groups
  - Open Preview - Opens asset in preview panel
  - Copy Path - Copies file path to clipboard with checkmark feedback
  - Copy Import Code - Submenu with HTML/React/Vue code snippets
  - Open in Editor - Opens first importer location in configured editor (disabled if no importers)
  - Reveal in Finder/Explorer - Opens system file explorer and highlights the file (platform-specific)
  - Mark/Unmark as Ignored - Toggle ignored state (only for unused assets)
  - Delete - Bulk delete with confirmation dialog
- **Keyboard shortcuts**: Displays shortcuts (⌘O, ⌘⇧R, ⌫) in menu
- **Visual feedback**: Checkmark indicators for copy success, disabled states for unavailable actions
- **Implementation**: `useAssetActions` hook, `AssetContextMenu` component, `file-revealer.ts` server utility
- **API endpoint**: `/reveal-in-finder` (POST)
- **Cross-platform**: Supports macOS (Finder), Windows (Explorer), and Linux (xdg-open)

### Duplicate File Detection
Identify duplicate files by content hash:
- **Algorithm**: MD5 hash of file contents with streaming for files >1MB
- **Cache strategy**: Two-level caching (hash cache + duplicate groups) validated by mtime+size
- **UI indicators**: "X duplicates" badge on asset cards showing duplicate count
- **Real-time updates**: File changes trigger hash recalculation and SSE broadcast
- **Performance**: Batch processing (20 files at a time) to avoid overwhelming I/O
- **Implementation**: `DuplicateScanner` class, `useDuplicates` hook, `DuplicatesSection` component
- **API endpoint**: `/duplicates?hash=` (GET) returns all assets with matching hash
- **SSE events**: `asset-manager:duplicates-update` emitted when duplicate status changes
- **Asset enrichment**: Adds `contentHash` and `duplicatesCount` fields to Asset type
- **Filtering**: Can filter to show only files with duplicates
- **Use cases**: Find duplicate images, identify redundant assets, clean up project files

### Keyboard Navigation
Full keyboard support for navigating and managing assets:
- **Navigation**: Arrow keys (grid-aware), `j`/`k` (vim-style), `Tab`/`Shift+Tab` (cycle focus)
- **Focus**: `/` to focus search, `Escape` to close preview or blur search
- **Selection**: `Space` to toggle, `Enter` to preview, `Cmd/Ctrl+A` select all, `Cmd/Ctrl+D` deselect
- **Actions**: `Delete`/`Backspace` to delete, `Cmd/Ctrl+C` copy paths, `Cmd/Ctrl+O` open in editor, `Cmd/Ctrl+Shift+R` reveal in Finder
- **Implementation**: `useKeyboardNavigation` hook integrated with `App.tsx`
- **Features**: Grid-aware column calculation, platform-aware modifier keys, respects input field focus

### Advanced Filtering
Filter assets by size, date modified, and file extension:
- **Filter categories**:
  - **Size**: Small (<100KB), Medium (100KB-1MB), Large (1-10MB), Extra Large (>10MB)
  - **Date**: Today, Last 7 days, Last 30 days, Last 90 days, This year
  - **Extensions**: Multi-select from available extensions in current asset set
- **UI**: Dropdown button with active filter count badge, organized sections with checkmarks
- **Clear all**: Quickly reset all active filters
- **API support**: Query params `minSize`, `maxSize`, `minDate`, `maxDate`, `extensions` (comma-separated)
- **Implementation**: `useAdvancedFilters` hook, `AdvancedFilters` component
- **Integration**: Works with type filters, unused/duplicate filters, and search
- **Performance**: Uses primitive string dependencies to prevent unnecessary rerenders (Vercel best practice)

### Virtual Scrolling
Virtualized grid rendering for handling large asset collections (100+ assets) without DOM bloat:
- **Library**: `@tanstack/react-virtual` for row-based virtualization
- **Implementation**: `useVirtualGrid` hook wraps virtualizer, `useResponsiveColumns` calculates grid columns
- **Row height**: Fixed 244px (200px card + 44px footer) with 16px gap
- **Overscan**: 2 rows buffer for smooth scrolling
- **Scroll container**: Shared `mainRef` passed from `App.tsx` to each `AssetGrid`
- **Scroll-to-item**: Keyboard navigation triggers `scrollToItem()` to keep focused asset visible
- **Features**: Absolute positioning with `translateY()`, maintains all existing interactions (selection, context menu, preview)

### Performance Optimizations (Vercel Best Practices)
React performance optimizations applied without breaking changes:
- **Hoisted JSX**: Static components (`LoadingSpinner`, `EmptyState`) defined outside render
- **Primitive dependencies**: Hooks return `filterParamsString` (string) instead of objects to prevent re-renders
- **Stable callbacks**: `isIgnored` uses ref pattern for consistent reference identity
- **Single-pass filtering**: `displayGroups` computation combines multiple iterations into one loop
- **Cached property access**: Sort comparisons cache property lookups
- **Functional setState**: Uses callback form to avoid stale closures
- **Implementation**: See `.claude/REFACTORING_SUMMARY.md` for detailed changes

## Development Notes

- **Adding shadcn components**: Run `npx shadcn@latest add <component>` from project root; components install to `src/ui/components/ui/`
