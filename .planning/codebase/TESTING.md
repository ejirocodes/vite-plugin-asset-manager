# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Vitest with Vite integration
- Config: `vitest.config.ts`

**Assertion Library:**
- `@testing-library/react` for component testing (queries, render, waitFor)
- `@testing-library/user-event` for user interaction simulation
- `@testing-library/jest-dom` for matchers like `toBeInTheDocument()`
- Vitest native assertions: `expect()` with standard matchers

**Run Commands:**
```bash
pnpm run test              # Run all tests once
pnpm run test:watch        # Watch mode
pnpm run test:ui           # Vitest UI dashboard
pnpm run test:coverage     # Coverage report (v8 provider)
pnpm run test:server       # Node environment tests only
pnpm run test:client       # jsdom environment tests only
```

## Test File Organization

**Location:**
- **Co-located with source**: Test files placed in same directory as source
- **Server tests**: `packages/core/src/**/*.test.ts`
- **UI tests**: `src/ui/**/*.test.{ts,tsx}`
- **Test utilities**: `tests/setup.ts`, `tests/setup-ui.ts`, `tests/mocks/`

**Naming:**
- `*.test.ts` for server/utility tests
- `*.test.tsx` for React component tests
- Pattern: `source-filename.test.ts` (e.g., `scanner.ts` → `scanner.test.ts`)

**Structure:**
```
packages/core/src/
├── services/
│   ├── scanner.ts
│   ├── scanner.test.ts
│   ├── thumbnail.ts
│   └── thumbnail.test.ts
└── __tests__/        (if mocks needed)
    └── mocks/
        ├── chokidar.ts
        ├── fast-glob.ts
        └── ...

src/ui/
├── hooks/
│   ├── useAssets.ts
│   ├── useAssets.test.ts
│   └── ...
├── components/
│   ├── asset-card.tsx
│   ├── asset-card.test.tsx
│   └── ...
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

describe('FeatureName', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks()
  })

  describe('methodName()', () => {
    it('should do something specific', () => {
      // Arrange
      const expected = ...

      // Act
      const result = ...

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

**Patterns:**

1. **Nested describe blocks**: Group related tests by method/behavior
2. **Clear test names**: Start with "should" - describes expected behavior
3. **AAA pattern**: Arrange, Act, Assert (comments optional but recommended for complex tests)
4. **One assertion per test** (when possible, multi-assertion for related checks acceptable)
5. **beforeEach/afterEach**: Always reset mocks and cleanup between tests
6. **Promise handling**: Use `waitFor()` for async state updates, `act()` for state changes

## Mocking

**Framework:** Vitest native `vi` module with `vi.fn()`, `vi.mock()`, `vi.spyOn()`

**Patterns:**

### Module-level mocking (most common):
```typescript
// Hoist mock functions to top level (outside factory) to prevent re-evaluation
const { mockFg, mockChokidarWatch } = vi.hoisted(() => ({
  mockFg: vi.fn(),
  mockChokidarWatch: vi.fn()
}))

// Mock module imports before importing source
vi.mock('fast-glob', () => ({
  default: mockFg
}))

vi.mock('chokidar', () => ({
  default: {
    watch: mockChokidarWatch
  }
}))

// Now safe to import the source file that uses mocked modules
import { AssetScanner } from './scanner'
```

### Hook mocking (React Testing Library):
```typescript
const mockSubscribe = vi.fn().mockReturnValue(() => {})

vi.mock('./useSSE', () => ({
  useSSE: () => ({
    subscribe: mockSubscribe
  })
}))

// Then test the hook that uses useSSE
const { result } = renderHook(() => useAssets())
```

### Fetch mocking (API calls):
```typescript
beforeEach(() => {
  mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: ... })
  })
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})
```

### Global fetch in UI setup:
- Pre-stubbed in `tests/setup-ui.ts` as `const mockFetch = vi.fn()`
- Available globally as `globalThis.fetch`
- Reset before each test: `mockFetch.mockReset()` or full stub reset

**What to Mock:**
- External dependencies (file system, chokidar watcher, sharp image processor)
- API calls (fetch, SSE EventSource)
- Child components in component tests (e.g., icon libraries, card preview components)
- Other hooks when testing a specific hook in isolation
- Platform APIs (clipboard, editor launching)

**What NOT to Mock:**
- Core business logic of the service being tested
- Utility functions (unless they're slow or have side effects)
- TypeScript types/interfaces
- Simple components that are part of the feature (may mock their props only)

## Fixtures and Factories

**Test Data:**

Global test utilities in `tests/setup.ts`:

```typescript
export function createMockAsset(overrides: Partial<Asset> = {}): Asset {
  const path = overrides.path ?? 'test/image.png'
  const name = overrides.name ?? path.split('/').pop() ?? 'image.png'
  const extension = overrides.extension ?? `.${name.split('.').pop()}`

  return {
    id: Buffer.from(path).toString('base64url'),
    name,
    path,
    absolutePath: `/project/${path}`,
    extension,
    type: 'image' as AssetType,
    size: 1024,
    mtime: Date.now(),
    directory: path.split('/').slice(0, -1).join('/') || '.',
    ...overrides
  }
}

export function createMockImporter(overrides: Partial<Importer> = {}): Importer {
  return {
    filePath: 'src/App.tsx',
    absolutePath: '/project/src/App.tsx',
    line: 5,
    column: 1,
    importType: 'es-import' as ImportType,
    snippet: "import logo from './assets/logo.png'",
    ...overrides
  }
}
```

**Usage in tests:**
```typescript
const asset = createMockAsset({ name: 'logo.png', type: 'image' })
const importer = createMockImporter({ line: 10, column: 5 })
```

**Custom fixtures per test file:**
- Inline mock data for test-specific scenarios
- Example: scanner test defines `DEFAULT_OPTIONS` constant with default ResolvedOptions
- UI test hook mocks define `mockGroups`, `mockImporters` arrays

**Location:**
- Global utilities exported from `tests/setup.ts`
- Available globally as `testUtils` on Node and jsdom environments
- Test-specific fixtures defined inside `describe()` blocks

## Coverage

**Requirements:** No enforced minimum (configured but not required)

**View Coverage:**
```bash
pnpm run test:coverage
# Generates: ./coverage/
```

**Coverage Configuration** (`vitest.config.ts`):
- Provider: v8 (built-in)
- Reporters: text, json, html, lcov
- Directory: `./coverage/`
- Include: `src/server/**/*.ts`, `src/plugin.ts`, `src/ui/**/*.{ts,tsx}`
- Exclude: node_modules, dist, playground, *.d.ts, tests/**, src/ui/components/ui/** (shadcn), **.config.* files

## Test Types

**Unit Tests:**

- **Server services** (`packages/core/src/**/*.test.ts`):
  - 6 test suites: scanner, thumbnail, api, importer-scanner, editor-launcher, duplicate-scanner
  - Test individual service methods
  - Mock external I/O (fs, chokidar, sharp)
  - Environment: Node (`node` in vitest config)

- **UI hooks** (`src/ui/hooks/*.test.ts`):
  - 7 hook test suites: useAssets, useSearch, useSSE, useImporters, useDuplicates, useVirtualGrid, useResponsiveColumns
  - Test hook state and side effects
  - Mock fetch API and EventSource
  - Use `renderHook()` from @testing-library/react
  - Environment: jsdom (browser DOM)

**Integration Tests:**

- **API Router tests** (`packages/core/src/api/api.test.ts`):
  - Mock request/response objects
  - Test routing logic (which handler called for which path)
  - Mock all services (scanner, importer-scanner, etc.)
  - Verify correct response formats

**Component Tests:**

- **React components** (`src/ui/components/**/*.test.tsx`):
  - 3 component test suites: asset-card, search-bar, ignored-assets-provider
  - Test render output, user interaction
  - Mock child components and hooks
  - Use `render()`, `screen`, `fireEvent`, `userEvent`
  - Environment: jsdom

**E2E Tests:**

- Framework: Playwright (separate config at `e2e/playwright.config.ts`)
- Run: `pnpm run test:e2e` (headless), `pnpm run test:e2e:ui`, `pnpm run test:e2e:headed`, `pnpm run test:e2e:debug`
- Test full user flows in real browser

## Common Patterns

**Async Testing:**

Using `waitFor` for hook updates:
```typescript
it('should fetch assets on mount', async () => {
  const { result } = renderHook(() => useAssets())

  expect(result.current.loading).toBe(true)

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.groups).toHaveLength(1)
})
```

Using `act` for state changes and user interaction:
```typescript
await act(async () => {
  await result.current.search('logo')
})

expect(result.current.results).toHaveLength(1)
```

Mocking async promises:
```typescript
let resolvePromise: () => void
const pendingPromise = new Promise<void>(resolve => {
  resolvePromise = resolve
})

globalThis.fetch = vi.fn().mockImplementation(async () => {
  await pendingPromise
  return { ok: true, json: async () => ({ ... }) }
})

// Start async operation
act(() => {
  result.current.search('logo')
})

expect(result.current.searching).toBe(true)

// Resolve promise
await act(async () => {
  resolvePromise!()
  await new Promise(r => setTimeout(r, 0))
})
```

**Error Testing:**

Server API errors:
```typescript
it('should handle fetch errors', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 500
  })

  const { result } = renderHook(() => useAssets())

  await waitFor(() => {
    expect(result.current.error).toBe('Failed to fetch assets')
  })
})
```

Network/thrown errors:
```typescript
it('should handle network errors', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'))

  const { result } = renderHook(() => useAssets())

  await waitFor(() => {
    expect(result.current.error).toBe('Network error')
  })
})
```

**Event Testing:**

File watcher events:
```typescript
it('should emit change event when file is added', async () => {
  const scanner = new AssetScanner('/project', DEFAULT_OPTIONS)
  await scanner.init()

  const changeSpy = vi.fn()
  scanner.on('change', changeSpy)

  // Simulate watcher event
  mockWatcher.emit('add', '/project/src/new-image.png')

  await new Promise(resolve => setTimeout(resolve, 50))

  expect(changeSpy).toHaveBeenCalledWith(
    expect.objectContaining({ event: 'add', path: 'src/new-image.png' })
  )
})
```

SSE events (mock EventSource):
```typescript
const mockEventSource = new MockEventSource('/api/events')
mockEventSource.simulateMessage({ type: 'asset-manager:update', data: {...} })
expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'asset-manager:update' }))
```

**Timeout Configuration:**

```typescript
// vitest.config.ts
test: {
  testTimeout: 10000,      // Default test timeout
  hookTimeout: 10000,      // Hooks (beforeEach, etc.)
  teardownTimeout: 5000    // Cleanup
}
```

## Environment-Specific Setup

**Server tests (Node):**
- Setup file: `tests/setup.ts`
- Globals: vi, describe, it, expect, beforeEach, afterEach
- Exports: `createMockAsset()`, `createMockImporter()`

**UI tests (jsdom):**
- Setup files: `tests/setup.ts` then `tests/setup-ui.ts`
- Globals: everything from server + DOM APIs, window, document
- Added mocks: `MockEventSource`, fetch (`mockFetch`), navigator.clipboard (`mockClipboard`)
- React Testing Library cleanup: auto-cleans up after each test via afterEach hook

**Cleanup in setup-ui.ts:**
```typescript
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()  // Clean up DOM and React state between tests
})
```

---

*Testing analysis: 2026-03-20*
