# Codebase Concerns

**Analysis Date:** 2025-03-20

## Test Coverage Gaps

**Skipped Test Suites:**
- Issue: Core service tests are skipped due to mocking limitations with native modules
- Files:
  - `packages/core/src/services/scanner.test.ts` (line 50-51: `.skip('AssetScanner')`)
  - `packages/core/src/services/importer-scanner.test.ts` (line 50: `.skip('ImporterScanner')`)
  - `packages/core/src/services/thumbnail.test.ts` (line 50-51: `.skip('ThumbnailService')`)
  - `packages/core/src/services/editor-launcher.test.ts` (line 13: TODO comment)
- Impact: Critical service logic is untested; file watching, scanning, and thumbnail generation lack verification
- Fix approach:
  - Refactor mocks to properly handle ES modules and native bindings (Sharp)
  - Consider using real filesystem operations in test fixtures for more integration-style tests
  - Set up Vitest mock factories correctly for modules with side effects

**API Test Mocking Issue:**
- Issue: SSE stream mock in `packages/core/src/api/api.test.ts` (line 383) doesn't properly emit events
- Files: `packages/core/src/api/api.test.ts` (line 383: TODO comment)
- Impact: SSE event broadcasting tests are incomplete; real-time update functionality lacks verification
- Fix approach: Implement proper `ReadableStream` mock that emits data and error events correctly

## Known Bugs & Quirks

**Asset Manager Initialization Race Condition:**
- Issue: `assetManager.init()` is not awaited in plugin layer before setting up watchers
- Files: `src/plugin.ts` (lines 33-37)
  ```typescript
  assetManager.init().then(() => {
    if (resolvedOptions.watch) {
      assetManager.setupWatchers(broadcastSSE)
    }
  })
  ```
- Problem: If requests arrive before `init()` completes, assets won't be found yet; middleware uses partially-initialized scanner
- Severity: Medium — UI will show empty/loading state but should recover once init completes
- Fix approach: Wait for initialization before installing middleware, or queue requests during init phase

**Next.js Adapter SSE Client Disconnection Handling:**
- Issue: SSE stream termination in `packages/nextjs/src/adapter.ts` (lines 135, 161, 223-224)
- Problem: When client disconnects mid-stream, `ReadableStreamDefaultController.enqueue()` may be called on closed controller
- Comments indicate awareness: "Controller may be closed if client disconnected"
- Severity: Low — try/catch blocks wrap calls, but relies on error handling
- Fix approach: Add explicit controller state check before calling `enqueue()`

## Tech Debt

**Importer Scanner: Regex-Based Import Detection**
- Issue: Uses simple regex patterns instead of AST-based analysis
- Files: `packages/core/src/services/importer-scanner.ts` (lines 70-104)
- Patterns used:
  - ES import: `/import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]*\.(?:png|jpg|...))['"]/gi`
  - Dynamic import: `import(...)`
  - require()
  - CSS url()
  - HTML src/href attributes
- Limitations:
  - Cannot handle complex import scenarios (e.g., re-exports, monorepo aliases beyond simple `@/`)
  - May miss imports in comments that regex incorrectly preserves
  - False positives in string literals containing asset paths
  - No support for TypeScript type imports or conditional imports
- Impact: Unused asset detection may be inaccurate; reported importer counts could be wrong
- Fix approach: Consider swallowing AST parser (babel/typescript) for accurate detection, with regex fallback for performance

**Comment Stripping Implementation**
- Issue: `stripComments()` in `importer-scanner.ts` (lines 57-64) replaces comments with spaces (not removal)
- Why it matters: Preserves character positions for regex matching but wastes processing on replaced strings
- Mitigation: This is actually intentional for regex match indexing accuracy
- Note: Not a bug, but worth documenting intent

**Duplicate Detection: MD5 Hashing for Security Purposes?**
- Issue: MD5 used for duplicate detection in `packages/core/src/services/duplicate-scanner.ts` (line 133)
- Not a security risk: MD5 is acceptable for duplicate detection (non-cryptographic use)
- Observation: Streaming threshold of 1MB (line 18) is reasonable for large files
- No action needed

**Floating Icon DOM Mutation Without Error Boundary**
- Issue: Direct DOM manipulation in `src/client/floating-icon/dom.ts` (306 lines)
- Files: `src/client/floating-icon/index.ts`, `dom.ts`, `styles.ts`, `events.ts`, `state.ts`
- Risk: If container element is removed by host app, overlay breaks silently
- Severity: Low — affects display only, not core functionality
- Fix approach: Add defensive checks for element existence; listen for parent removal events

## Performance Bottlenecks

**Large Asset Collections: Batch Processing Without Concurrency Limits**
- Issue: Batch sizes are fixed but processing is concurrent
- Files:
  - `packages/core/src/services/duplicate-scanner.ts` (lines 69-72: BATCH_SIZE = 20)
  - `packages/core/src/services/importer-scanner.ts` (lines 157-160: BATCH_SIZE = 50)
- Current approach: `Promise.all(batch.map(...))` processes each batch sequentially but all items in batch concurrently
- Bottleneck: Large projects (1000+ assets) will process 50 files concurrently during import scanning
- Impact: High disk I/O and memory usage during initial scan; can slow dev server
- Fix approach:
  - Reduce BATCH_SIZE to 10-15 for importer scanner (more I/O intensive)
  - Add configurable `maxConcurrency` option to AssetManagerOptions
  - Consider using a queue library like p-queue for fine-grained control

**Asset Grouping Recalculation**
- Issue: `getGroupedAssets()` in `packages/core/src/services/scanner.ts` (lines 136-150) rebuilds groups on every call
- Files: `packages/core/src/services/scanner.ts`
- Current: O(n log n) per call due to `.sort()` on each group
- Frequency: Called on every API request for grouped view
- Fix approach: Cache grouped assets; invalidate only on scanner change events

**UI: Large Asset Lists Without Pagination**
- Issue: React dashboard in `src/ui/App.tsx` (680 lines) loads all assets into memory
- Files: `src/ui/App.tsx`, `src/ui/components/asset-grid.tsx`, `src/ui/hooks/useVirtualGrid.ts`
- Mitigation: `useVirtualGrid` hook uses `@tanstack/react-virtual` for row virtualization (good!)
- Remaining issue: All metadata (names, paths, types) for all assets in state at once
- Impact: 1000+ assets = ~2-3MB state object in React + DOM nodes off-screen
- Fix approach: Investigate whether virtualization extends to asset loading or just rendering

## Fragile Areas

**Service Destruction and Cleanup**
- Issue: Multiple services implement `destroy()` but cleanup could be incomplete
- Files:
  - `packages/core/src/asset-manager.ts` (lines 85-89)
  - `packages/core/src/services/scanner.ts` (line 252)
  - `src/ui/hooks/useSSE.ts` (disconnect logic)
- Pattern: `destroy()` closes watchers but doesn't clear internal caches
- Risk: In Nuxt/Next.js hot-reload scenarios, lingering timers or event listeners could cause memory issues
- Fix approach:
  - Add explicit cache clearing in `destroy()` methods
  - Track all active timers and ensure cleanup in `disconnect()`
  - Add verification tests for complete resource cleanup

**Path Validation: String Prefix Check**
- Issue: `packages/core/src/api/utils.ts` (line 68) uses `startsWith()` for path security
- Code: `if (!absolutePath.startsWith(root)) return { error: 'Forbidden', status: 403 }`
- Vulnerability potential: If `root = '/project'` and malicious path = '/project-evil/file.txt'`, check passes
- Mitigation: Currently works because `path.resolve()` normalizes paths and removes `..`
- Risk level: Low (mitigated by resolve) but fragile
- Better approach: Use `path.relative()` and check if result starts with `..`
  ```typescript
  const relative = path.relative(root, absolutePath);
  if (relative.startsWith('..')) return { error: 'Forbidden', status: 403 }
  ```

**File Revealer: Cross-Platform Shell Execution**
- Issue: `packages/core/src/services/file-revealer.ts` uses `launch-editor` package for file opening
- Dependency risk: External package handles shell invocation
- Mitigation: `launch-editor` is well-maintained and commonly used (Vite uses it)
- No immediate concerns but worth monitoring for shell injection vectors

## Scaling Limits

**File Watching: Chokidar Resource Usage**
- Current: Each service (AssetScanner, ImporterScanner, DuplicateScanner) creates separate chokidar watchers
- Files: Multiple places in `packages/core/src/services/`
- Problem: 3 independent watchers on large projects (e.g., 10,000 files) = 3x file descriptor consumption
- Typical limit: macOS 256 per process (can increase with `ulimit`); Linux 1024+
- Impact: Projects with >5,000 files + node_modules symlinks risk hitting limits
- Fix approach: Consolidate to single shared chokidar instance with event filtering

**Thumbnail Disk Cache: No Pruning**
- Issue: `packages/core/src/services/thumbnail.ts` caches thumbnails in OS temp directory
- Files: `packages/core/src/services/thumbnail.ts`
- Cache key: Hash of file path + mtime + size
- Problem: Cache never expires; old project sessions leave thumbnails behind
- Impact: Long-term dev work could accumulate GB of unused thumbnails
- Fix approach:
  - Add optional LRU cache with max age (default: 7 days)
  - Implement cleanup task that runs on init or periodically
  - Add debug option to show cache size

**SSE Connection: No Message Queue**
- Issue: `src/ui/hooks/useSSE.ts` broadcasts events directly to subscribers
- Files: `src/ui/hooks/useSSE.ts` (lines 61-75)
- Problem: If handler is slow, other handlers block; dropped messages if UI is busy
- Impact: Real-time updates may not reach all subscribers in high-frequency scenarios
- Fix approach: Add optional message queue (in-memory ring buffer) to decouple broadcasting

## Missing Critical Features

**Error Recovery: No Automatic Reconnection Retry with Exponential Backoff**
- Issue: SSE reconnection uses fixed 1000ms delay
- Files: `src/ui/hooks/useSSE.ts` (lines 40-42, 85-87)
- Current: `MAX_RECONNECT_ATTEMPTS = 10`, `RECONNECT_DELAY = 1000` (constant)
- Impact: If server is temporarily down, 10 retries = ~10 second window; after that, no more retries
- Fix approach: Implement exponential backoff (1s → 2s → 4s → 8s, max 60s) and resume attempts on next user interaction

**No Request Deduplication for Duplicate API Calls**
- Issue: Multiple simultaneous requests for same resource not deduplicated
- Files: `packages/core/src/api/router.ts`, various handlers
- Scenario: User rapidly toggles asset preview → multiple `/api/assets/{id}` calls in flight
- Fix approach: Implement request coalescing using `Map<key, Promise>` pattern in middleware

**Debug Mode: Limited Observability**
- Issue: `debug` option (when enabled) only logs to console
- Files: `packages/core/src/` and throughout
- Problem: No structured logging; hard to correlate events in CI/server environments
- Fix approach: Support optional logger injection in AssetManagerOptions

## Security Considerations

**File Serving: No Range Request Validation**
- Issue: Large file downloads via `/api/file` endpoint
- Files: `packages/core/src/api/handlers/file-handler.ts` (lines 41-74)
- Current: Serves full file with cache headers but doesn't validate Range header properly
- Risk: Malicious Range requests could cause issues (unlikely but worth checking)
- Status: Likely safe (fs.createReadStream handles it) but not explicitly validated

**ZIP Download: No Size Limit**
- Issue: Bulk download creates ZIP without checking total uncompressed size
- Files: `packages/core/src/api/handlers/bulk-handler.ts` (lines 7-80)
- Risk: User could request all assets (e.g., 500MB) → OOM / disk space exhaustion
- Fix approach:
  - Add `maxBulkDownloadSize` option (default: 100MB)
  - Check total size before archiving; reject if exceeds limit
  - Stream directly to client instead of buffering

**Editor Launch: Command Injection via File Path?**
- Issue: `launch-editor` is invoked with file path from URL parameter
- Files: `packages/core/src/api/handlers/system-handler.ts`
- Mitigation: Path is validated with `validateFilePath()` before passing to `launch-editor`
- Risk: Low (path validation + external library handles escaping)

**Next.js Adapter: Missing Environment Check in Production**
- Issue: `packages/nextjs/src/handler.ts` should only run in dev mode
- Current: Checks `NODE_ENV` but no explicit guard in handler factory
- Files: `packages/nextjs/src/index.ts` (re-exports, likely checks in `createHandler`)
- Fix approach: Add explicit `if (process.env.NODE_ENV !== 'development')` check in handler to prevent accidental exposure

## Dependencies at Risk

**Sharp: Native Module Build Dependency**
- Risk: Sharp requires native compilation for image processing
- Impact: Installation can fail on systems without build tools (Windows, ARM macOS)
- Current: Listed in `packageManager.onlyBuiltDependencies` in package.json (line 136-139)
- Fix: Documented correctly; pnpm won't try to build from source in workspaces
- Recommendation: Keep documentation clear that `pnpm` handles this; warn users on CI without native build support

**Archiver: Zip Creation**
- Status: Well-maintained, no known vulnerabilities
- Risk: zip bombs via specially crafted paths (mitigated by path validation)
- No action needed

**Chokidar: File Watching**
- Status: De-facto standard for file watching; well-maintained
- Known issue: Can be resource-intensive on large projects (mitigated by our batching)
- No action needed

---

*Concerns audit: 2025-03-20*
