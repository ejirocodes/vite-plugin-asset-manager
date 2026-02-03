# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite Plugin Asset Manager is a visual asset management dashboard for Vite projects. It provides a real-time web UI that discovers, catalogues, and displays all media assets (images, videos, audio, documents, fonts, data files, text) with thumbnail generation and search capabilities.

- Node requirement: >=22
- Vite compatibility: >=5.0.0
- Package type: ESM module with CJS support
- Package manager: pnpm (workspace includes `packages/*` and `playgrounds/*`)

## Monorepo Structure

The project uses a monorepo architecture with three packages:

| Package | Description | Location |
|---------|-------------|----------|
| `vite-plugin-asset-manager` | Main Vite plugin (re-exports from core) | Root `./` |
| `@vite-asset-manager/core` | Core functionality (scanners, API, middleware) | `packages/core/` |
| `@vite-asset-manager/nuxt` | Official Nuxt module | `packages/nuxt/` |

**Dependency Graph**:
```
vite-plugin-asset-manager
    └── @vite-asset-manager/core

@vite-asset-manager/nuxt
    └── @vite-asset-manager/core
```

## Vite Framework Support

**Static HTML Frameworks** (automatic via `transformIndexHtml`):
- [x] Vanilla
- [x] Vue
- [x] React
- [x] Preact
- [x] Lit
- [x] Svelte
- [x] Solid
- [x] Qwik

**SSR Frameworks with Official Modules**:
- [x] Nuxt 3/4 - Use `@vite-asset-manager/nuxt` module (automatic floating icon injection + DevTools integration)

**SSR Frameworks** (manual script injection required):
- [x] TanStack Start

See `docs/SSR_INTEGRATION.md` for setup instructions for TanStack Start, Next.js, Remix, SvelteKit, and Solid Start.

## Build Commands

```bash
pnpm install                  # Install all deps (root + packages + playgrounds)
pnpm run build:all            # Build everything (packages → main plugin)
pnpm run build:packages       # Build core + nuxt packages
pnpm run build                # Build main plugin (runs build:ui → build:floating-icon → build:plugin)
pnpm run build:ui             # Build React dashboard using Vite → dist/client/
pnpm run build:floating-icon  # Build floating icon component → dist/client/floating-icon.js
pnpm run build:plugin         # Build plugin using tsup → dist/index.js, dist/index.cjs
pnpm run dev                  # Watch mode for plugin development using tsup
```

**Build Order**:
1. `build:packages` - Builds `@vite-asset-manager/core` then `@vite-asset-manager/nuxt`
2. `build:ui` - React dashboard
3. `build:floating-icon` - Floating icon IIFE
4. `build:plugin` - Main Vite plugin

The tsup config uses `clean: false` to preserve the UI and floating icon builds. The floating icon uses `emptyOutDir: false` to preserve the UI build.

## Quick Development Workflow

```bash
# 1. Make changes to core package (packages/core/)
pnpm run build:packages

# 2. Make changes to UI (src/ui/)
pnpm run build:ui

# 3. Make changes to floating icon (src/client/floating-icon/)
pnpm run build:floating-icon

# 4. Make changes to plugin layer (src/plugin.ts, src/index.ts)
pnpm run build:plugin

# 5. Test in a playground
pnpm run playground:svelte   # or :react, :vue, :nuxt, etc.

# 6. Full rebuild after major changes
pnpm run build:all
```

**Typical iteration**: Edit code → `pnpm run build:ui` → refresh playground browser

## Testing with the Playgrounds

The `playgrounds/` directory contains framework-specific demo projects:

- `playgrounds/react/` - Vite+React demo
- `playgrounds/vue/` - Vite+Vue demo
- `playgrounds/vanilla/` - Vite+Vanilla (no framework) demo
- `playgrounds/preact/` - Vite+Preact demo
- `playgrounds/lit/` - Vite+Lit demo
- `playgrounds/svelte/` - Vite+Svelte demo
- `playgrounds/solid/` - Vite+Solid demo
- `playgrounds/qwik/` - Vite+Qwik demo
- `playgrounds/nuxt/` - Nuxt 3 demo (uses `@vite-asset-manager/nuxt` module)

```bash
cd playgrounds/react
pnpm run dev           # Start dev server with asset manager at /__asset_manager__/

# Or from root:
pnpm run playground:react
pnpm run playground:vue
pnpm run playground:vanilla
pnpm run playground:preact
pnpm run playground:lit
pnpm run playground:svelte
pnpm run playground:solid
pnpm run playground:qwik
pnpm run playground:nuxt    # Nuxt playground (uses official module)
```

Each playground imports the plugin directly from `../../src/index` (no pnpm link needed). They also include `vite-plugin-inspect` for debugging Vite internals.

**Keyboard shortcut**: Press `⌥⇧A` (Option+Shift+A) in the host app to toggle the asset manager panel. Press `Escape` to close.

## Architecture

### Four-Layer Structure

1. **Plugin Layer** (`src/index.ts`, `src/plugin.ts`)
   - Vite plugin entry point, only active in 'serve' mode
   - Provides virtual module `virtual:asset-manager-config` for build-time config
   - Broadcasts SSE events when assets/importers change via `broadcastSSE()`
   - Injects floating icon script via `transformIndexHtml()` hook

2. **Client Layer** (`src/client/floating-icon/`)
   - Framework-agnostic floating button that opens the Asset Manager panel
   - Built as self-executing IIFE, injectable into any Vite app
   - Composable-style state management inspired by Vue DevTools architecture
   - Features: drag support, edge snapping, localStorage persistence, keyboard shortcuts
   - See "Floating Icon Component" section below for details

3. **Core Package** (`packages/core/src/`) - `@vite-asset-manager/core`
   - `services/scanner.ts` - EventEmitter-based file scanner using fast-glob + chokidar for watching
   - `services/thumbnail.ts` - Sharp-based thumbnail generation with dual-tier caching (memory + disk in OS temp)
   - `services/importer-scanner.ts` - Detects which source files import each asset (ES imports, dynamic imports, require, CSS url, HTML attributes)
   - `services/duplicate-scanner.ts` - Content-based duplicate detection using MD5 hashing with streaming support for large files
   - `services/editor-launcher.ts` - Opens files in configured editor at specific line/column using launch-editor
   - `services/file-revealer.ts` - Cross-platform utility to reveal files in system file explorer (Finder/Explorer)
   - `api/router.ts` - HTTP API router with endpoints: `/assets`, `/assets/grouped`, `/search`, `/thumbnail`, `/file`, `/stats`, `/importers`, `/duplicates`, `/open-in-editor`, `/reveal-in-finder`, `/bulk-download`, `/bulk-delete`, `/events` (SSE)
   - `middleware/create-middleware.ts` - Middleware factory, serves API at `{base}/api/*` and dashboard UI via sirv
   - `asset-manager.ts` - `AssetManager` orchestrator class that initializes all services
   - `types/index.ts` - All shared TypeScript types

4. **UI Layer** (`src/ui/`)
   - Self-contained React dashboard with its own `tsconfig.json`
   - Uses Tailwind CSS v4 and shadcn/ui (base-mira style with Phosphor icons)
   - Includes favicon: `src/ui/assets/icon.svg` (referenced in `src/ui/index.html`)
   - **Code Splitting**: Manual chunk splitting reduces main bundle from 711 KB to 75 KB
     - vendor-react: React runtime (193 KB)
     - vendor-ui: UI component libraries (254 KB)
     - vendor-icons: Phosphor icons (155 KB)
     - vendor-virtual: TanStack Virtual (15 KB)
   - **Lazy Loading**: PreviewPanel lazy loaded with React.lazy() and Suspense
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

### Floating Icon Component

Framework-agnostic overlay button (`src/client/floating-icon/`) built as self-executing IIFE.

**Key Files**: `index.ts` (entry), `state.ts` (composable state managers), `events.ts` (drag/keyboard handlers), `dom.ts` (element creation), `styles.ts` (CSS injection)

**Build**: `vite.config.floating-icon.ts` → `dist/client/floating-icon.js` (IIFE format)

**Features**: Draggable with edge snapping, resizable panel, keyboard shortcuts (⌥⇧A toggle, Escape close), localStorage persistence, auto light/dark theme

**Integration**: Injected via `transformIndexHtml()` hook in `src/plugin.ts`, sets `window.__VAM_BASE_URL__` global

For full architecture details, see `.claude/reminder/architecture.md` section "Floating Icon System".

### Nuxt Module (`packages/nuxt/`)

The `@vite-asset-manager/nuxt` package provides first-class Nuxt 3/4 support.

**Structure**:
- `src/module.ts` - Nuxt module definition using `@nuxt/kit`
- `src/runtime/plugin.client.ts` - Client-side floating icon injection

**Features**:
- Auto-configures with sensible Nuxt defaults
- Automatic floating icon injection (no manual `app.vue` setup)
- Nuxt DevTools integration (iframe tab)
- Supports both Nuxt 3 and Nuxt 4 directory structures
- Uses Nitro `devHandlers` for dev-only middleware

**Configuration** (`nuxt.config.ts`):
```typescript
export default defineNuxtConfig({
  modules: ['@vite-asset-manager/nuxt'],
  assetManager: {
    base: '/__asset_manager__',
    include: ['assets', '../public'],  // Relative to srcDir
    floatingIcon: true,
    devtools: true,  // Add DevTools tab
  }
})
```

### TypeScript Configuration

- Root `tsconfig.json` - Plugin code (excludes `src/ui/` and `src/client/`), uses `@/*` → `./src/*` alias
- `src/ui/tsconfig.json` - Dashboard code with DOM libs, uses `@/*` → `./src/*` alias (baseUrl: `../..`)
- `src/client/floating-icon/tsconfig.json` - Floating icon code targeting ES2020 with DOM libs
- `packages/core/tsconfig.json` - Core package with Node types
- `packages/nuxt/tsconfig.json` - Nuxt module with @nuxt/kit types

### shadcn/ui Configuration (`components.json`)

All shadcn components install to `src/ui/`:
- UI components: `@/ui/components/ui/`
- Utils: `@/ui/lib/utils`
- Hooks: `@/ui/hooks/`

### Shared Types (`packages/core/src/types/index.ts`)

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

# Run a specific test file
pnpm run test tests/server/scanner.test.ts
pnpm run test src/ui/hooks/useAssets.test.ts

# Run tests matching a pattern
pnpm run test -t "scanner"
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

## Feature Reference

| Feature | Key Files | Description |
|---------|-----------|-------------|
| Bulk Operations | `useBulkOperations`, `BulkActionsBar` | Multi-select with Shift/Ctrl+click, copy paths, ZIP download, bulk delete |
| Unused Detection | `Asset.importersCount`, `useStats` | Badge on cards, sidebar filter, tracks assets with no importers |
| Ignored Assets | `IgnoredAssetsProvider`, `useIgnoredAssets` | localStorage-persisted hiding without deletion |
| Context Menu | `useAssetActions`, `AssetContextMenu` | Right-click for preview, copy, reveal in Finder, delete |
| Duplicates | `DuplicateScanner`, `useDuplicates` | MD5 content hashing, badge showing duplicate count |
| Keyboard Nav | `useKeyboardNavigation` | Arrow keys, vim-style `j`/`k`, shortcuts for all actions |
| Advanced Filters | `useAdvancedFilters`, `AdvancedFilters` | Filter by size, date, extension with presets |
| Virtual Scrolling | `useVirtualGrid`, `useResponsiveColumns` | `@tanstack/react-virtual` for 100+ assets |
| Code Splitting | `vite.config.ui.ts` | Main bundle 711KB → 75KB (89% reduction) |
| Responsive Design | `globals.css`, all components | Mobile-first, 320px to 4K+, bottom sheet on mobile |

For detailed implementation notes, see `.claude/reminder/architecture.md` and `.claude/reminder/quick-reference.md`.

## Troubleshooting

Common issues and solutions are documented in `.claude/reminder/quick-reference.md`:

- **Assets not showing**: Check `include` option matches directory structure, verify file extensions
- **Thumbnails not generating**: Only works for jpg/jpeg/png/webp/avif/gif/tiff; check Sharp installation
- **Real-time updates not working**: Ensure `watch: true`, check browser console for SSE errors
- **UI shows main app**: Run `pnpm run build:ui` to build UI files to `dist/client/`

## Development Notes

- **Adding shadcn components**: Run `npx shadcn@latest add <component>` from project root; components install to `src/ui/components/ui/`
