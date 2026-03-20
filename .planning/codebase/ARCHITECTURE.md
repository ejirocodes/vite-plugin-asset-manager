# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Layered monorepo with plugin-middleware-service architecture

**Key Characteristics:**
- **Vite plugin entry point** (`src/plugin.ts`, `src/index.ts`) active only in 'serve' mode
- **Core service layer** (`packages/core/src/`) with EventEmitter-based scanners and shared API
- **UI dashboard layer** (`src/ui/`) as self-contained React application with code splitting
- **Client layer** (`src/client/floating-icon/`) as framework-agnostic IIFE for overlay button
- **Framework adapters** (`packages/nuxt/`, `packages/nextjs/`) that wrap core functionality

## Layers

**Plugin Layer:**
- Purpose: Vite integration, dev server setup, virtual modules, asset manager orchestration
- Location: `src/plugin.ts`, `src/index.ts`
- Contains: Vite plugin factory, configuration hooks, middleware integration
- Depends on: `@vite-asset-manager/core`
- Used by: Vite dev server during development

**API Layer:**
- Purpose: HTTP routing, request handling, response formatting
- Location: `packages/core/src/api/router.ts`, `packages/core/src/api/handlers/`, `packages/core/src/middleware/create-middleware.ts`
- Contains: Route handlers for assets, files, system actions, bulk operations; SSE event management
- Depends on: Service layer (scanner, thumbnail, importer, duplicate detection)
- Used by: Middleware layer to serve requests

**Service Layer:**
- Purpose: Core business logic—file discovery, thumbnail generation, import tracking, duplicate detection
- Location: `packages/core/src/services/`
- Contains:
  - `scanner.ts` - EventEmitter-based asset discovery via fast-glob + chokidar watching
  - `importer-scanner.ts` - Regex-based import detection (ES imports, require, CSS url, HTML attributes)
  - `duplicate-scanner.ts` - Content-based deduplication via MD5 hashing with streaming
  - `thumbnail.ts` - Sharp-based thumbnail generation with dual-tier caching (memory + OS temp)
  - `editor-launcher.ts` - File opening via launch-editor package
  - `file-revealer.ts` - Cross-platform file explorer reveal
- Depends on: fast-glob, chokidar, sharp, fs, path
- Used by: AssetManager orchestrator and API handlers

**Orchestration Layer:**
- Purpose: Wiring services together, managing initialization and lifecycle
- Location: `packages/core/src/asset-manager.ts`
- Contains: `AssetManager` class that initializes all services, enriches assets with metadata, manages watchers
- Depends on: All services
- Used by: Plugin layer and framework adapters

**Middleware Layer:**
- Purpose: HTTP request routing, static file serving, API proxying
- Location: `packages/core/src/middleware/create-middleware.ts`
- Contains: Express-like middleware factory, sirv static serving, API router delegation
- Depends on: API router, service layer
- Used by: Plugin layer to integrate with Vite dev server

**UI Dashboard Layer:**
- Purpose: Interactive React dashboard for browsing assets, previewing, and performing actions
- Location: `src/ui/`
- Contains: React components, hooks, providers, assets API client, Tailwind CSS styling
- Depends on: API layer (via fetch), React, shadcn/ui, @tanstack/react-virtual
- Used by: Browser rendering at `/__asset_manager__/`

**Floating Icon Layer:**
- Purpose: Framework-agnostic overlay button for toggling asset manager panel
- Location: `src/client/floating-icon/`
- Contains: DOM manipulation, state management, event handlers, CSS injection; built as IIFE
- Depends on: None (no external dependencies)
- Used by: Injected into host app via transformIndexHtml hook

## Data Flow

**Asset Discovery:**

1. User starts Vite dev server with plugin configured
2. Plugin layer initializes AssetManager
3. AssetManager calls scanner.init() → scanner.scan()
4. Scanner uses fast-glob to discover files matching extensions in include directories, excludes node_modules/dist/etc
5. Assets cached in memory as Map<path, Asset>
6. Scanner emits 'change' event when watch detects file additions/deletions
7. Plugin receives change event and broadcasts via SSE

**Importer Detection:**

1. ImporterScanner.init() scans all source files (JS/TS/CSS/HTML/Vue/Svelte/etc)
2. Regex patterns search for imports of discovered assets
3. Import detection: ES imports, dynamic imports, require(), CSS url(), HTML src/href attributes
4. Path aliases applied (e.g., @/ → src/)
5. Results cached as Map<assetPath, Importer[]>
6. On source file changes, importer counts updated and SSE event broadcast

**User Interaction:**

1. User opens Asset Manager at /__asset_manager__/ or via floating icon
2. UI requests `/api/assets` endpoint
3. AssetScanner returns cached assets
4. UI renders asset grid with thumbnails, counts, badges
5. User searches, filters, or clicks asset
6. UI requests `/api/importers?asset=<id>` to show which files import asset
7. User clicks "Open in Editor" → calls `/api/open-in-editor` → launch-editor opens file at line/column
8. Real-time SSE connection updates UI when files change

**Duplicate Detection:**

1. DuplicateScanner.init() reads all asset files and computes MD5 hash via streaming
2. Hash cached by mtime+size to avoid recomputation
3. Duplicates grouped by content hash
4. Scanner enriches assets with duplicatesCount
5. UI displays "2 duplicates" badge and detail panel shows duplicate files

**Bulk Operations:**

1. User multi-selects assets (Shift+click, Ctrl+click)
2. BulkActionsBar shows "Copy paths", "Download as ZIP", "Delete"
3. Copy paths → useAssetClipboard hook → clipboard.write()
4. Download → POST /api/bulk-download with asset IDs → archiver creates ZIP → download
5. Delete → POST /api/bulk-delete → fs.unlink() for each asset

**State Management:**

- **Plugin state**: Stored in closure variables (config, assetManager instance)
- **Scanner caches**: In-memory Map for fast lookups, re-scanned on watch events
- **UI state**: React hooks (useAssets, useSearch, useSSE) + context providers (ThemeProvider, IgnoredAssetsProvider)
- **Floating icon state**: Composable-style state managers (positionState, panelState, sizeState) with localStorage persistence

## Key Abstractions

**Asset:**
- Purpose: Represents a discovered file with metadata
- Examples: `packages/core/src/types/index.ts` - Asset interface
- Pattern: Plain TypeScript interface extended with optional importer/duplicate counts

**AssetManager:**
- Purpose: Orchestrates all services and provides unified entry point
- Examples: `packages/core/src/asset-manager.ts`
- Pattern: Class-based singleton that initializes services in constructor, exposes init()/setupWatchers()/destroy()

**EventEmitter:**
- Purpose: Services emit change events for real-time UI updates
- Examples: AssetScanner, ImporterScanner, DuplicateScanner all extend EventEmitter
- Pattern: Node.js EventEmitter pattern; emit 'change' on modifications, plugin subscribes and broadcasts SSE

**Middleware:**
- Purpose: Framework-agnostic HTTP request handler
- Examples: `packages/core/src/middleware/create-middleware.ts` returns (req, res, next) => void
- Pattern: Express-like middleware; composition via router that delegates to specialized handlers

**Hook (React):**
- Purpose: Encapsulates data fetching, subscriptions, and state logic
- Examples: `useAssets`, `useSearch`, `useSSE`, `useImporters`, `useKeyboardNavigation`
- Pattern: Custom hooks follow React conventions; manage internal state and effects; export state + actions

**Provider (React):**
- Purpose: Context-based state management
- Examples: `ThemeProvider`, `IgnoredAssetsProvider`
- Pattern: React.createContext + custom hook for consuming context (e.g., useIgnoredAssets)

## Entry Points

**Plugin Entry (Vite):**
- Location: `src/index.ts`
- Triggers: When Vite is configured with `assetManager()` plugin in dev mode
- Responsibilities: Re-exports plugin factory from `src/plugin.ts`, exports public types from core

**Plugin Factory (Core):**
- Location: `src/plugin.ts`
- Triggers: Plugin instantiation via Vite
- Responsibilities: Return Vite plugin object with hooks (configResolved, configureServer, transformIndexHtml, resolveId, load, buildEnd)

**Configuration Server (Vite):**
- Location: `src/plugin.ts` - configureServer() hook
- Triggers: Vite dev server initialization
- Responsibilities: Create AssetManager, initialize services, setup middleware, inject floating icon script

**UI Entry:**
- Location: `src/ui/main.tsx`
- Triggers: Browser loads /__asset_manager__/ route
- Responsibilities: Render React root with providers (Theme, IgnoredAssets), mount App component

**Floating Icon Entry:**
- Location: `src/client/floating-icon/index.ts`
- Triggers: Browser executes injected floating-icon.js script
- Responsibilities: Check for window.__VAM_BASE_URL__, call initFloatingIcon(), setup DOM and event handlers

**Nuxt Module Entry:**
- Location: `packages/nuxt/src/module.ts`
- Triggers: Module loaded via `modules: ['@vite-asset-manager/nuxt']` in nuxt.config.ts
- Responsibilities: Configure Nuxt with dev middleware, auto-inject floating icon component

**Next.js Handler Entry:**
- Location: `packages/nextjs/src/handler.ts`
- Triggers: Route handler at app/api/asset-manager/[[...path]]/route.ts
- Responsibilities: Wrap core middleware, adapt Web API (Request/Response) to Node.js HTTP (IncomingMessage/ServerResponse)

## Error Handling

**Strategy:** Hierarchical error types with status codes and context

**Patterns:**
- `AssetManagerError` base class in `packages/core/src/errors.ts` with statusCode, code, context
- API handlers catch errors and respond with JSON { error, code }
- Path validation prevents traversal attacks by checking paths resolve within project root
- Thumbnail generation catches Sharp errors and returns 500 with error context
- Missing files return 404 with asset not found message
- Large file handling uses HTTP Range headers for streaming

## Cross-Cutting Concerns

**Logging:**
- Approach: Console logging when `debug: true` in options
- Implementation: Services log paths, glob patterns, file counts at init time
- UI console logs SSE connection errors and API fetch failures

**Validation:**
- Path security: All file operations validate paths resolve within project root using path.resolve + startsWith check
- Query parameters: Parsed via Node.js URL.parse, validated by handler before use
- Asset IDs: Base64url-encoded relative paths, decoded and validated before file access

**Authentication:**
- Approach: Dev-only (Vite serve mode only), no auth in plugin layer
- Implementation: Plugin apply: 'serve' ensures only active in development
- Next.js: `NODE_ENV` check in handler to return 404 in production

**Virtual Modules:**
- `virtual:asset-manager-config` provides base and extensions to UI via resolveId/load hooks
- Config passed as JSON string, no dynamic evaluation

**Real-time Updates:**
- SSE connection at /api/events, server broadcasts asset-manager:update events
- UI hook (useSSE) maintains singleton EventSource, subscribes to events, refetches affected data
- Debouncing: File watcher stabilization 100ms, search debounce 200ms

**Performance Optimization:**
- Thumbnail caching: Key = hash(path) + mtime + size, stored in OS temp directory
- Asset caching: In-memory Map lookup O(1), no re-scan on every request
- Code splitting: UI main 75KB + vendor chunks (react 193KB, ui 254KB, icons 155KB, virtual 15KB)
- Virtual scrolling: @tanstack/react-virtual renders only visible rows
- Lazy loading: PreviewPanel lazy loaded with React.lazy() and Suspense

**Cross-platform Support:**
- File revealer uses platform detection (node:os) to open Finder (macOS), Explorer (Windows), file manager (Linux)
- Editor launcher supports 20+ editors, abstracted via launch-editor package
- Path handling uses node:path, posix-like paths internally, OS-specific in file system operations
