# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Not detected.** The asset manager is a self-contained dashboard with no external API dependencies. All functionality is internal to the Vite dev server or production build.

## Data Storage

**Databases:**
- Not used. No database integration.

**File Storage:**
- Local filesystem only - Assets are discovered and served from the project root directory
  - Supported locations configured via `include` option (default: `['src', 'public']`)
  - Excluded directories: `['node_modules', '.git', 'dist', '.cache', 'coverage']`
  - Scanner: `packages/core/src/services/scanner.ts` uses `fast-glob` + `chokidar` for discovery

**Caching:**
- In-memory cache: `ThumbnailService` maintains `Map<string, Buffer>` for generated thumbnails
- Disk cache: Thumbnails cached in `os.tmpdir()/vite-asset-manager-thumbnails` with cache key based on file path hash + mtime + size
- Implementation: `packages/core/src/services/thumbnail.ts`

## Authentication & Identity

**Auth Provider:**
- Not used. The Asset Manager dashboard runs on localhost dev server only and has no authentication mechanism.
- Production: Dashboard available only in dev mode (checks `NODE_ENV` in Next.js integration)
- Access control: None - browser-based access via `/__asset_manager__` or `/api/asset-manager` routes

## Monitoring & Observability

**Error Tracking:**
- Not detected. No external error tracking service integrated.
- Local error handling: `packages/core/src/errors.ts` defines `AssetManagerError` with statusCode, code, and context

**Logs:**
- Console logging only (via `picocolors` for colored output)
- Conditional: Enabled with `debug: true` option
- Implementation: `packages/core/src/services/scanner.ts`, `ThumbnailService`
- Plugin diagnostics: Paths and scanning logs output to Node.js console in dev mode

**Real-time Updates:**
- Server-Sent Events (SSE) - Bidirectional change notifications
  - Endpoint: `/__asset_manager__/api/events` (or `/api/asset-manager/api/events` for Next.js)
  - Implementation: `packages/core/src/api/sse-manager.ts`
  - Events: Asset changes, file additions/deletions broadcasted via `broadcastSSE(event, data)`
  - Client: Singleton `EventSource` in UI with auto-reconnect logic

## CI/CD & Deployment

**Hosting:**
- npm Registry - NPM packages published to registry.npmjs.org
  - Three main packages: `vite-plugin-asset-manager`, `@vite-asset-manager/core`, `@vite-asset-manager/nuxt`
  - One secondary package: `nextjs-asset-manager`
- GitHub Releases - Auto-generated release notes and artifacts

**CI Pipeline:**
- GitHub Actions - `.github/workflows/ci.yml` and `.github/workflows/release.yml`

**CI Jobs:**
1. Test Job (`ci.yml`):
   - Runs on ubuntu-latest
   - Node 22 + pnpm
   - Steps: Install → Build packages → Build UI → Run unit tests
   - Uploads artifacts: None

2. E2E Job (`ci.yml`):
   - Runs on ubuntu-latest
   - Node 22 + pnpm
   - Installs Playwright browsers (chromium)
   - Steps: Install → Build packages → Build UI → Run E2E tests
   - Uploads Playwright report to GitHub artifacts (7-day retention)

3. Publish Job (`release.yml`):
   - Triggered on git tags matching `v*`
   - Publishes 4 packages in sequence to npm registry:
     - `@vite-asset-manager/core` (packages/core)
     - `@vite-asset-manager/nuxt` (packages/nuxt)
     - `nextjs-asset-manager` (packages/nextjs)
     - `vite-plugin-asset-manager` (root)
   - Uses `NPM_TOKEN` secret for authentication

4. GitHub Release Job (`release.yml`):
   - Creates GitHub release with auto-generated notes
   - Depends on publish job success
   - Uses `GITHUB_TOKEN` secret

## Environment Configuration

**Required env vars:**
- None required for development. Configuration via `vite.config.ts` plugin options.
- `NODE_AUTH_TOKEN` - NPM authentication token for CI/CD publish (GitHub Actions secret)
- `GITHUB_TOKEN` - GitHub API token for release creation (GitHub Actions secret, provided by GH)

**Secrets location:**
- GitHub: `.github/workflows/` files reference `secrets.NPM_TOKEN` and `secrets.GITHUB_TOKEN`
- No `.env` files checked into version control
- Node.js environment: `process.env.NODE_ENV` checked for dev-only mode in Next.js integration

## Webhooks & Callbacks

**Incoming:**
- Not applicable. Dashboard is read-only with no incoming webhook handlers.

**Outgoing:**
- File system watchers emit change events via `chokidar` with 100ms stabilization delay
  - Triggers: File created, modified, deleted in `include` directories
  - Broadcasting: `broadcastSSE()` sends change events to all connected SSE clients
  - Implementation: `packages/core/src/plugin.ts` calls `assetManager.setupWatchers(broadcastSSE)`

## Editor Integration

**Editor Launcher:**
- `launch-editor` package (2.12.0) - Cross-platform editor launching
  - Configurable editor: Default `'code'` (VS Code), supports Vim, Emacs, Sublime, etc.
  - Feature: Click asset path in UI to open in configured editor at specific line/column
  - Integration point: `packages/core/src/services/editor-launcher.ts`
  - Implementation: `useAssetFileActions` hook in UI for "Open in Editor" button
  - Config: `launchEditor` option in plugin configuration

## File System Operations

**File Revealer:**
- Cross-platform file explorer integration
  - macOS: Uses `open` command via `child_process` to launch Finder
  - Windows: Uses `explorer.exe` to open folder
  - Linux: Uses `xdg-open` to launch file manager
  - Feature: "Reveal in Finder" button on asset cards
  - Implementation: `packages/core/src/services/file-revealer.ts`

## Framework-Specific Integrations

**Nuxt 3/4 Module** (`packages/nuxt/`):
- Nuxt Kit integration for auto-configuration
- Nitro devHandlers for dev-only middleware
- Auto-injects floating icon via plugin system
- DevTools integration (iframe tab)

**Next.js 14+ Integration** (`packages/nextjs/`):
- Web API adapter bridges Next.js `Request`/`Response` to Node.js HTTP
- Route handler: `app/api/asset-manager/[[...path]]/route.ts`
- Client component: `<AssetManagerScript />` for floating icon injection
- Singleton pattern using `globalThis` with `Symbol.for()` keys
- Dev-only check via `NODE_ENV`

---

*Integration audit: 2026-03-20*
