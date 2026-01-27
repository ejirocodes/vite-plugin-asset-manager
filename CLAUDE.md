# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vite Plugin Asset Manager is a visual asset management dashboard for Vite projects. It provides a real-time web UI that discovers, catalogues, and displays all media assets (images, videos, audio, documents, fonts, data files, text) with thumbnail generation and search capabilities.

- Node requirement: >=22
- Vite compatibility: 5.0.0+ or 6.0.0+
- Package type: ESM module with CJS support
- Package manager: pnpm (workspace includes `playground/`)

## Build Commands

```bash
pnpm install           # Install all deps (root + playground workspace)
pnpm run build         # Build both UI and plugin (runs build:ui then build:plugin)
pnpm run build:ui      # Build React dashboard using Vite → dist/client/
pnpm run build:plugin  # Build plugin using tsup → dist/index.js, dist/index.cjs
pnpm run dev           # Watch mode for plugin development using tsup
```

The build order matters: UI must build first to `dist/client/` so the plugin can embed it. The tsup config uses `clean: false` to preserve the UI build.

## Testing with the Playground

The `playground/` directory is a pnpm workspace containing a demo Vite+React project:

```bash
cd playground
pnpm run dev           # Start dev server with asset manager at /__asset_manager__/
```

The playground imports the plugin directly from `../src/index` (no pnpm link needed). It also includes `vite-plugin-inspect` for debugging Vite internals.

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
   - `editor-launcher.ts` - Opens files in configured editor at specific line/column using launch-editor
   - `api.ts` - HTTP API router with endpoints: `/assets`, `/assets/grouped`, `/search`, `/thumbnail`, `/file`, `/stats`, `/importers`, `/open-in-editor`, `/events` (SSE)
   - `index.ts` - Middleware setup, serves API at `{base}/api/*` and dashboard UI via sirv

3. **UI Layer** (`src/ui/`)
   - Self-contained React dashboard with its own `tsconfig.json`
   - Uses Tailwind CSS v4 and shadcn/ui (base-mira style with Phosphor icons)
   - Structure:
     - `components/` - App components (Sidebar, SearchBar, AssetGrid, AssetCard, FileIcon)
     - `components/ui/` - shadcn primitives (Button, Card, Input, Sheet, Tabs, etc.)
     - `components/card-previews/` - Card preview components (FontCardPreview, VideoCardPreview)
     - `components/preview-panel/` - Asset preview system with type-specific renderers
       - `index.tsx` - Main panel using Sheet component
       - `renderers/` - Type-specific previews (image, video, audio, font, code, fallback)
       - `details-section.tsx`, `actions-section.tsx`, `code-snippets.tsx` - Panel sections
       - `importers-section.tsx` - Shows files that import the asset with click-to-open-in-editor
     - `hooks/` - `useAssets()` for fetching/subscriptions, `useSearch()` for debounced search, `useImporters()` for importer data and editor launch, `useSSE()` for real-time SSE connection
     - `providers/theme-provider.tsx` - Theme context using next-themes
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

Key types: `Asset`, `AssetGroup`, `AssetType`, `AssetManagerOptions`, `ResolvedOptions`, `Importer`, `ImportType`, `EditorType`

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

- `tests/server/` - Server-side tests (scanner, thumbnail, api, importer-scanner, editor-launcher)
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

## Development Notes

- **Adding shadcn components**: Run `npx shadcn@latest add <component>` from project root; components install to `src/ui/components/ui/`
