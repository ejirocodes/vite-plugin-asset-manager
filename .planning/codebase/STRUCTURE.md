# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
vite-plugin-asset-manager/
├── src/
│   ├── index.ts                          # Plugin entry point, re-exports from plugin.ts
│   ├── plugin.ts                         # Vite plugin implementation
│   ├── client/
│   │   └── floating-icon/                # Framework-agnostic floating button IIFE
│   │       ├── index.ts                  # Entry point, initialization
│   │       ├── state.ts                  # Composable state managers
│   │       ├── events.ts                 # Drag and keyboard handlers
│   │       ├── dom.ts                    # Element creation and mounting
│   │       ├── styles.ts                 # CSS injection
│   │       ├── constants.ts              # UI constants (edge positions, sizes)
│   │       └── icons.ts                  # Inline SVG icons
│   └── ui/
│       ├── main.tsx                      # React root entry point
│       ├── App.tsx                       # Main app component with layout
│       ├── index.html                    # HTML template
│       ├── vite-env.d.ts                 # Vite type definitions
│       ├── styles/
│       │   └── globals.css               # Tailwind entry point with CSS variables
│       ├── components/
│       │   ├── ui/                       # shadcn/ui primitives (button, card, sheet, etc)
│       │   ├── preview-panel/            # Asset preview and details
│       │   │   ├── index.tsx             # Main preview panel (Sheet)
│       │   │   ├── preview-section.tsx   # Preview display area
│       │   │   ├── details-section.tsx   # Asset metadata
│       │   │   ├── actions-section.tsx   # Download, delete, copy actions
│       │   │   ├── importers-section.tsx # Files that import asset
│       │   │   ├── duplicates-section.tsx # Duplicate files with same content
│       │   │   ├── code-snippets.tsx     # Import code examples
│       │   │   └── renderers/            # Type-specific previews
│       │   │       ├── image-preview.tsx
│       │   │       ├── video-preview.tsx
│       │   │       ├── audio-preview.tsx
│       │   │       ├── font-preview.tsx
│       │   │       ├── code-preview.tsx
│       │   │       └── fallback-preview.tsx
│       │   ├── card-previews/            # In-card previews
│       │   │   ├── font-card-preview.tsx
│       │   │   └── video-card-preview.tsx
│       │   ├── asset-grid.tsx            # Grid layout with cards
│       │   ├── asset-card.tsx            # Individual asset card
│       │   ├── asset-context-menu.tsx    # Right-click menu
│       │   ├── side-bar.tsx              # Directory tree and filters
│       │   ├── search-bar.tsx            # Search input
│       │   ├── sort-controls.tsx         # Sort dropdown
│       │   ├── advanced-filters.tsx      # Size/date/extension filters
│       │   ├── bulk-actions-bar.tsx      # Multi-select action bar
│       │   ├── file-icon.tsx             # File type icon component
│       │   └── mode-toggle.tsx           # Light/dark theme toggle
│       ├── hooks/                        # Custom React hooks
│       │   ├── useAssets.ts              # Fetch and subscribe to assets
│       │   ├── useSearch.ts              # Debounced search
│       │   ├── useSSE.ts                 # Server-Sent Events connection
│       │   ├── useImporters.ts           # Fetch files that import asset
│       │   ├── useDuplicates.ts          # Fetch duplicate files
│       │   ├── useBulkOperations.ts      # Multi-select and actions
│       │   ├── useKeyboardNavigation.ts  # Arrow keys, vim-style navigation
│       │   ├── useAdvancedFilters.ts     # Size/date/extension filtering
│       │   ├── useResponsiveColumns.ts   # Viewport-aware grid columns
│       │   ├── useVirtualGrid.ts         # @tanstack/react-virtual integration
│       │   ├── useEmbeddedMode.ts        # Detect embedded in floating icon
│       │   ├── useAssetClipboard.ts      # Copy path and import code
│       │   ├── useAssetFileActions.ts    # Open in editor, reveal in finder
│       │   ├── useAssetMutations.ts      # Delete and ignore assets
│       │   └── useStats.ts               # Asset statistics
│       ├── providers/                    # React context providers
│       │   ├── theme-provider.tsx        # Light/dark theme (next-themes)
│       │   └── ignored-assets-provider.tsx # localStorage-persisted ignored assets
│       ├── lib/                          # Utility functions
│       │   ├── utils.ts                  # tailwind cn() utility
│       │   ├── api-base.ts               # Detect API base URL
│       │   ├── asset-api.ts              # Fetch wrappers
│       │   ├── code-snippets.ts          # Generate import snippets
│       │   └── sort-utils.ts             # Sort logic
│       ├── types/
│       │   └── index.ts                  # UI-specific type extensions
│       └── tsconfig.json                 # UI-specific TypeScript config
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── index.ts                  # Public exports
│   │   │   ├── asset-manager.ts          # Service orchestrator class
│   │   │   ├── types/
│   │   │   │   └── index.ts              # Shared TypeScript types
│   │   │   ├── errors.ts                 # Error types
│   │   │   ├── services/
│   │   │   │   ├── scanner.ts            # File discovery via fast-glob + chokidar
│   │   │   │   ├── importer-scanner.ts   # Import detection via regex
│   │   │   │   ├── duplicate-scanner.ts  # Content-based duplicate detection
│   │   │   │   ├── thumbnail.ts          # Image thumbnail generation (Sharp)
│   │   │   │   ├── editor-launcher.ts    # Open file in editor
│   │   │   │   └── file-revealer.ts      # Reveal in system explorer
│   │   │   ├── api/
│   │   │   │   ├── router.ts             # Main HTTP router
│   │   │   │   ├── sse-manager.ts        # Server-Sent Events handler
│   │   │   │   ├── filters.ts            # Query parameter parsing
│   │   │   │   ├── utils.ts              # Response helpers
│   │   │   │   └── handlers/
│   │   │   │       ├── asset-handler.ts  # Assets, grouped, search, stats
│   │   │   │       ├── file-handler.ts   # Thumbnail and file serving
│   │   │   │       ├── system-handler.ts # Importers, editor, finder
│   │   │   │       └── bulk-handler.ts   # Download ZIP, delete
│   │   │   └── middleware/
│   │   │       └── create-middleware.ts  # Framework-agnostic middleware factory
│   │   ├── dist/
│   │   │   ├── client/                   # Pre-built UI and floating icon
│   │   │   │   ├── index.html
│   │   │   │   ├── assets/               # CSS, fonts, icons
│   │   │   │   ├── floating-icon.js      # IIFE blob
│   │   │   │   └── vendor-*.js           # Code-split chunks
│   │   │   └── index.js/cjs/d.ts         # Compiled core package
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── nuxt/
│   │   ├── src/
│   │   │   ├── module.ts                 # Nuxt module definition
│   │   │   └── runtime/
│   │   │       ├── plugin.client.ts      # Client-side floating icon injection
│   │   │       └── floating-icon.server.ts # Server-side integration
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── nextjs/
│       ├── src/
│       │   ├── index.ts                  # Main exports
│       │   ├── handler.ts                # Route handler factory
│       │   ├── adapter.ts                # Web API ↔ Node.js HTTP bridge
│       │   ├── singleton.ts              # globalThis HMR-safe storage
│       │   ├── with-asset-manager.ts     # next.config.ts wrapper
│       │   └── components/
│       │       └── AssetManagerScript.tsx # 'use client' component
│       ├── package.json
│       └── tsconfig.json
├── playgrounds/
│   ├── react/                            # Vite+React demo
│   ├── vue/                              # Vite+Vue demo
│   ├── vanilla/                          # Vite+Vanilla demo
│   ├── preact/                           # Vite+Preact demo
│   ├── lit/                              # Vite+Lit demo
│   ├── svelte/                           # Vite+Svelte demo
│   ├── solid/                            # Vite+Solid demo
│   ├── qwik/                             # Vite+Qwik demo
│   ├── tanstack/                         # TanStack Start (manual SSR)
│   ├── nuxt/                             # Nuxt 3/4 demo
│   └── nextjs/                           # Next.js 14+ demo
├── tests/
│   ├── setup.ts                          # Global test setup
│   ├── setup-ui.ts                       # UI test setup (jsdom, mocks)
│   └── mocks/                            # Shared test utilities
├── e2e/
│   ├── playwright.config.ts
│   └── tests/                            # Playwright e2e tests
├── docs/
│   ├── SSR_INTEGRATION.md                # Setup guide for SSR frameworks
│   └── ...
├── .github/workflows/                    # CI/CD workflows (release, test)
├── dist/                                 # Build output
│   ├── index.js                          # ESM bundle
│   ├── index.cjs                         # CJS bundle
│   ├── index.d.ts                        # Type definitions
│   └── client/                           # Pre-built UI for npm tarball
├── .planning/                            # GSD planning documents
│   └── codebase/                         # Architecture analysis
├── package.json                          # Monorepo root
├── pnpm-workspace.yaml                   # Workspace config
├── pnpm-lock.yaml                        # Dependency lock
├── tsconfig.json                         # Root TypeScript config
├── tsup.config.ts                        # Plugin build config
├── vite.config.ui.ts                     # UI build config
├── vite.config.floating-icon.ts          # Floating icon build config
├── vitest.config.ts                      # Test runner config
├── eslint.config.js                      # Linting rules
├── .prettierrc                           # Code formatter config
├── components.json                       # shadcn config
├── CLAUDE.md                             # Project guidelines
└── README.md
```

## Directory Purposes

**`src/`:**
- Purpose: Plugin source code, UI dashboard, and floating icon
- Contains: Vite plugin entry, React dashboard components, floating icon IIFE
- Key files: `src/index.ts` (plugin entry), `src/ui/App.tsx` (dashboard root), `src/client/floating-icon/index.ts` (overlay button)

**`src/plugin.ts`:**
- Purpose: Vite plugin implementation
- Contains: Plugin hooks (configResolved, configureServer, transformIndexHtml, resolveId, load, buildEnd)
- Key responsibility: Initialize AssetManager, create middleware, inject floating icon script

**`src/client/floating-icon/`:**
- Purpose: Framework-agnostic overlay button
- Contains: DOM manipulation, state management, event handlers, CSS injection
- Build output: `dist/client/floating-icon.js` (IIFE)

**`src/ui/`:**
- Purpose: React dashboard UI
- Contains: Components, hooks, providers, styles
- Build output: `packages/core/dist/client/` (HTML + JS chunks)

**`src/ui/components/`:**
- Purpose: React component library
- Contains: Grid, cards, sidebar, preview panel, dialogs, menus
- Pattern: Each major feature is a separate directory (preview-panel/, card-previews/), UI primitives in ui/

**`src/ui/hooks/`:**
- Purpose: Custom React hooks for data fetching and logic
- Contains: useAssets, useSearch, useSSE, useImporters, useKeyboardNavigation, etc
- Pattern: One hook per file, named use*.ts

**`src/ui/providers/`:**
- Purpose: React context providers
- Contains: ThemeProvider (light/dark), IgnoredAssetsProvider (localStorage)
- Pattern: Provider component + custom hook for consuming context

**`packages/core/src/`:**
- Purpose: Core library shared by all framework adapters
- Contains: Services, API handlers, middleware, types
- Key exports: AssetManager, createAssetManagerMiddleware, all types

**`packages/core/src/services/`:**
- Purpose: Core business logic services
- Contains: File discovery, import detection, duplicate detection, thumbnails, editor integration
- Pattern: Each service extends EventEmitter, exposes init() and destroy()

**`packages/core/src/api/`:**
- Purpose: HTTP API implementation
- Contains: Route handlers, request/response utilities, SSE management
- Pattern: router.ts delegates to specialized handlers in handlers/ directory

**`packages/core/src/api/handlers/`:**
- Purpose: Modular endpoint handlers
- Contains: asset-handler (assets, search, stats), file-handler (thumbnails, files), system-handler (importers, editor, finder), bulk-handler (download, delete)
- Pattern: Named exports, receive dependencies, return void (write response directly)

**`packages/core/src/middleware/`:**
- Purpose: Framework-agnostic HTTP middleware
- Contains: Middleware factory that wires router and static serving
- Key file: `create-middleware.ts` - returns (req, res, next) => void function

**`packages/nuxt/src/`:**
- Purpose: Nuxt 3/4 module integration
- Contains: Nuxt module definition, client plugin for floating icon injection
- Pattern: Uses @nuxt/kit composables (addDevServerHandler, addImportsSources, etc)

**`packages/nextjs/src/`:**
- Purpose: Next.js 14+ integration
- Contains: Route handler factory, Web API adapter, singleton storage, client component
- Key files: `handler.ts` (createHandler factory), `adapter.ts` (Request/Response ↔ IncomingMessage/ServerResponse), `components/AssetManagerScript.tsx` ('use client' component)

**`packages/nextjs/src/adapter.ts`:**
- Purpose: Bridge Web API (Next.js) to Node.js HTTP API
- Contains: MockIncomingMessage and MockServerResponse adapters
- Pattern: Implements Readable/Writable interfaces to match Node.js HTTP

**`playgrounds/`:**
- Purpose: Framework demo projects for development and testing
- Contains: One subdirectory per framework (react/, vue/, nuxt/, nextjs/, etc)
- Key file: Each playground's vite.config.ts or next.config.ts imports plugin from `../../src/index`

**`packages/core/dist/client/`:**
- Purpose: Pre-built UI assets
- Contains: `index.html`, `floating-icon.js`, CSS/JS chunks
- Generated by: `pnpm run build:ui` and `pnpm run build:floating-icon`

**`tests/`:**
- Purpose: Global test setup and shared mocks
- Contains: Vitest setup, jest-dom, EventSource mock, fetch mock
- Key files: `setup.ts` (node environment), `setup-ui.ts` (jsdom environment)

**`packages/core/src/__tests__/`:**
- Purpose: Server-side tests (co-located with code)
- Contains: Tests for scanner, importer-scanner, duplicate-scanner, thumbnail, editor-launcher, API
- Key files: `scanner.test.ts`, `importer-scanner.test.ts`, `duplicate-scanner.test.ts`

**`src/ui/**/*.test.tsx`:**
- Purpose: UI component and hook tests (co-located)
- Contains: Tests for components, hooks, providers
- Key files: `useAssets.test.ts`, `useSearch.test.ts`, `asset-card.test.tsx`, `search-bar.test.tsx`

## Key File Locations

**Entry Points:**
- `src/index.ts` - Plugin entry, exports default function and re-exports core types
- `src/plugin.ts` - Vite plugin implementation
- `src/ui/main.tsx` - React dashboard root
- `src/client/floating-icon/index.ts` - Floating icon IIFE
- `packages/core/src/asset-manager.ts` - Service orchestrator
- `packages/nuxt/src/module.ts` - Nuxt module
- `packages/nextjs/src/handler.ts` - Next.js route handler

**Configuration:**
- `packages/core/src/types/index.ts` - Shared types and default options
- `.prettierrc` - Code formatting rules
- `eslint.config.js` - ESLint rules for plugin (Node/TS) and UI (React/TSX)
- `components.json` - shadcn/ui configuration (components install to src/ui/components/ui/)

**Core Logic:**
- `packages/core/src/services/scanner.ts` - File discovery with fast-glob + chokidar
- `packages/core/src/services/importer-scanner.ts` - Import detection with regex
- `packages/core/src/services/duplicate-scanner.ts` - Content-based duplicate detection
- `packages/core/src/services/thumbnail.ts` - Image thumbnail generation with Sharp
- `packages/core/src/api/router.ts` - HTTP route dispatcher
- `packages/core/src/middleware/create-middleware.ts` - Middleware factory

**Testing:**
- `packages/core/src/__tests__/scanner.test.ts` - Scanner tests
- `src/ui/hooks/useAssets.test.ts` - useAssets hook tests
- `tests/setup.ts` - Global test utilities
- `e2e/playwright.config.ts` - E2E test configuration

**Build Outputs:**
- `dist/index.js` - ESM plugin bundle
- `dist/index.cjs` - CJS plugin bundle
- `packages/core/dist/client/` - Pre-built UI and floating icon
- `packages/core/dist/index.js` - Compiled core package

## Naming Conventions

**Files:**
- `*.ts` - TypeScript server/plugin code (Node.js runtime)
- `*.tsx` - TypeScript React components
- `*.test.ts`, `*.test.tsx` - Test files (co-located with source)
- `vite.config.*.ts` - Vite configuration files for different builds
- `tsconfig.json` - TypeScript configuration per directory/package
- Services: `scanner.ts`, `importer-scanner.ts` (kebab-case with domain)
- API handlers: `asset-handler.ts`, `file-handler.ts`, `system-handler.ts`, `bulk-handler.ts`
- Hooks: `useAssets.ts`, `useSearch.ts`, `useSSE.ts` (camelCase with use prefix)
- Providers: `*-provider.tsx` (kebab-case)
- Components: `asset-card.tsx`, `asset-grid.tsx` (kebab-case)
- UI primitives: `button.tsx`, `card.tsx` (lowercase)

**Directories:**
- `src/` - Source root (plugin + ui + client)
- `src/ui/` - Dashboard React app
- `src/client/` - Client-side browser code (floating icon)
- `packages/` - Monorepo packages (core, nuxt, nextjs)
- `playgrounds/` - Framework demo projects
- `tests/` - Shared test setup
- `dist/` - Build outputs
- `.planning/` - GSD analysis documents
- `__tests__/` - Test files (core package co-location)

**Import Paths:**
- Root: `@/*` → `./src/*` (plugin code uses @/plugin, @/client, etc)
- UI: `@/*` → `./src/*` (UI code uses @/ui/lib, @/ui/components, etc) - baseUrl points to root
- Core: No alias, uses relative imports
- Playgrounds: Import plugin from `../../src/index` (no link needed)

## Where to Add New Code

**New Asset Feature:**
- Service logic: `packages/core/src/services/` - create new service class extending EventEmitter
- API endpoint: `packages/core/src/api/handlers/` - add handler function, route in `packages/core/src/api/router.ts`
- UI component: `src/ui/components/` - create component and hook in `src/ui/hooks/`
- Tests: Co-locate with source (`*.test.ts` or `*.test.tsx`)

**New Component/Module:**
- Plugin-only feature: `src/plugin.ts` or new `src/modules/` subdirectory
- Core-shared feature: `packages/core/src/services/` and corresponding API handler
- UI-only feature: `src/ui/components/` directory with test file

**Utilities:**
- Plugin utilities: `src/` with @/* alias import
- UI utilities: `src/ui/lib/` (e.g., `lib/utils.ts`, `lib/api-base.ts`)
- Core utilities: `packages/core/src/` with appropriate directory
- Shared types: `packages/core/src/types/index.ts`

**Testing:**
- Server tests: `packages/core/src/__tests__/` (co-locate with services)
- UI tests: `src/ui/**/*.test.tsx` (co-locate with components/hooks)
- Global setup: `tests/setup.ts`, `tests/setup-ui.ts`
- Mocks: `packages/core/src/__tests__/mocks/` or `tests/mocks/`

**Framework Adapters:**
- Nuxt module: `packages/nuxt/src/module.ts` and `packages/nuxt/src/runtime/`
- Next.js: `packages/nextjs/src/handler.ts` and `packages/nextjs/src/components/`
- Custom framework: New package `packages/[framework]/` following Nuxt/Next.js structure

## Special Directories

**`packages/core/dist/client/`:**
- Purpose: Pre-built UI and floating icon served to browser
- Generated: `true` (via build scripts)
- Committed: `false` (built artifacts in .gitignore)
- Contents: `index.html`, `floating-icon.js`, vendor chunks, assets (CSS, fonts)

**`playgrounds/*/node_modules`:**
- Purpose: Dependencies for demo projects
- Generated: `true`
- Committed: `false`
- Note: Playgrounds use pnpm workspace, linked to root node_modules

**`dist/` (root):**
- Purpose: Built plugin package
- Generated: `true`
- Committed: `false`
- Contents: `index.js` (ESM), `index.cjs` (CJS), `index.d.ts` (types), `client/` (UI assets)

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated: `false` (manually created)
- Committed: `true`
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**`packages/core/src/__tests__/mocks/`:**
- Purpose: Mock implementations of external dependencies for testing
- Files: `chokidar.mock.ts`, `fast-glob.mock.ts`, `fs.mock.ts`, `sharp.mock.ts`, `launch-editor.mock.ts`
- Pattern: Vitest.mock() calls in test files, defined in mocks/ for reuse
