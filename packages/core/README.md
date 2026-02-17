# @vite-asset-manager/core

Core functionality for [vite-plugin-asset-manager](https://github.com/ejirocodes/vite-plugin-asset-manager) — the visual asset management dashboard for Vite projects.

This package provides the scanning, API, middleware, and service layer that powers the main plugin and framework integrations (Nuxt, Next.js).

> **Note:** Most users should install [`vite-plugin-asset-manager`](https://www.npmjs.com/package/vite-plugin-asset-manager) directly. This package is for building custom integrations or framework adapters.

## Installation

```bash
npm install @vite-asset-manager/core
# or
pnpm add @vite-asset-manager/core
```

## What's Included

### Services

| Service | Description |
|---------|-------------|
| `AssetScanner` | File discovery using fast-glob with chokidar file watching |
| `ImporterScanner` | Detects which source files import each asset (ES imports, dynamic imports, require, CSS url, HTML attributes) |
| `DuplicateScanner` | Content-based duplicate detection using MD5 hashing with streaming support |
| `ThumbnailService` | Sharp-powered thumbnail generation with dual-tier caching (memory + disk) |
| `launchEditor` | Opens files in your editor at a specific line/column |
| `revealInFileExplorer` | Cross-platform utility to reveal files in Finder/Explorer |

### API & Middleware

| Export | Description |
|--------|-------------|
| `createApiRouter` | HTTP API router with modular handlers for assets, files, system operations, and bulk actions |
| `broadcastSSE` | Server-Sent Events broadcaster for real-time file change notifications |
| `createAssetManagerMiddleware` | Connect-compatible middleware factory that serves the API and dashboard UI |

### Orchestrator

| Export | Description |
|--------|-------------|
| `AssetManager` | High-level orchestrator that initializes and coordinates all services |

## Usage

```ts
import {
  AssetManager,
  createAssetManagerMiddleware,
  broadcastSSE,
  type AssetManagerOptions
} from '@vite-asset-manager/core'

// Initialize
const manager = new AssetManager({
  root: process.cwd(),
  options: {
    base: '/__asset_manager__',
    include: ['src', 'public'],
    exclude: ['node_modules', '.git', 'dist'],
    watch: true,
    launchEditor: 'code',
  }
})

await manager.init()

// Set up file watching with SSE broadcasting
manager.setupWatchers(broadcastSSE)

// Create Connect-compatible middleware
const middleware = createAssetManagerMiddleware({
  base: '/__asset_manager__',
  scanner: manager.scanner,
  importerScanner: manager.importerScanner,
  duplicateScanner: manager.duplicateScanner,
  thumbnailService: manager.thumbnailService,
  root: process.cwd(),
  launchEditor: 'code',
})

// Use with any Node.js HTTP server
server.use(middleware)

// Cleanup
manager.destroy()
```

## API Endpoints

The middleware serves these endpoints at `{base}/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assets` | GET | List all assets |
| `/assets/grouped` | GET | Assets grouped by directory |
| `/search?q=` | GET | Search by name/path |
| `/thumbnail?path=` | GET | Get image thumbnail |
| `/file?path=` | GET | Serve original file |
| `/stats` | GET | Asset statistics |
| `/importers?path=` | GET | Files importing the asset |
| `/duplicates?hash=` | GET | Assets with matching content hash |
| `/open-in-editor` | POST | Open file in editor |
| `/reveal-in-finder` | POST | Reveal in system file explorer |
| `/bulk-download` | POST | Download as ZIP |
| `/bulk-delete` | POST | Delete multiple assets |
| `/events` | GET | SSE stream for real-time updates |

## Types

All shared types are exported from this package:

```ts
import type {
  Asset,
  AssetGroup,
  AssetType,
  AssetManagerOptions,
  ResolvedOptions,
  AssetStats,
  Importer,
  ImportType,
  EditorType,
  DuplicateInfo,
  AdvancedFilters,
} from '@vite-asset-manager/core'
```

## Requirements

- Node.js >= 22
- [Sharp](https://sharp.pixelplumbing.com/) (bundled as dependency for thumbnail generation)

## Related

- [`vite-plugin-asset-manager`](https://www.npmjs.com/package/vite-plugin-asset-manager) — Main Vite plugin
- [`@vite-asset-manager/nuxt`](https://www.npmjs.com/package/@vite-asset-manager/nuxt) — Official Nuxt module
- [`nextjs-asset-manager`](https://www.npmjs.com/package/nextjs-asset-manager) — Official Next.js integration

## License

[MIT](https://github.com/ejirocodes/vite-plugin-asset-manager/blob/main/LICENSE)
