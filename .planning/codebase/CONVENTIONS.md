# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- `camelCase.ts` for server/plugin files: `scanner.ts`, `thumbnail.ts`, `editor-launcher.ts`
- `camelCase.tsx` for React components: `asset-card.tsx`, `search-bar.tsx`
- Kebab-case for multi-word filenames: `importer-scanner.ts`, `asset-context-menu.tsx`
- Index files use `index.ts` or `index.tsx` for barrel exports
- Test files: `*.test.ts` or `*.test.tsx` co-located with source files

**Functions:**
- `camelCase` for all function and method names
- Prefixed with action verbs for clarity: `handleClick`, `launchEditor`, `fetchAssets`, `openInEditor`, `revealInFinder`
- Hook functions prefixed with `use`: `useAssets`, `useSearch`, `useSSE`, `useImporters`, `useDuplicates`
- Factory functions prefixed with `create`: `createAssetManagerPlugin`, `createApiRouter`, `createMockAsset`
- Private helper functions use underscore prefix: `_printUrls` (seen in plugin.ts)

**Variables:**
- `camelCase` for all variables: `mockAssets`, `thumbnailUrl`, `formatBytesCache`
- Boolean variables prefixed with `is` or `has`: `isImage`, `isIgnored`, `isFocused`, `hasImporters`
- Collections suffixed with plural: `assets`, `groups`, `importers`, `results`
- Constants use `UPPER_SNAKE_CASE`: `SOURCE_EXTENSIONS`, `ASSET_EXTENSIONS`, `ASSET_EXT_PATTERN`
- Constants defined at module level, often in hoisted factory: `const { mockFg, mockChokidarWatch, mockFsStat } = vi.hoisted(() => ({...}))`

**Types:**
- `PascalCase` for interface/type names: `Asset`, `AssetGroup`, `Importer`, `AssetCardProps`
- Suffixed with `Props` for component prop interfaces: `SearchBarProps`, `AssetCardProps`
- Suffixed with `Result` or similar for return types: `UseSearchResult`, `UseAssetsResult`
- Suffixed with `Event` for event types: `ImporterScannerEvents`
- No `I` prefix for interfaces (modern TypeScript convention)

## Code Style

**Formatting:**
- Prettier formatting enforced
- Configuration: `.prettierrc`
  - 2-space tab width
  - 100 character print width
  - Single quotes
  - No trailing commas
  - Semi-colons: false (auto-inserted)
  - Arrow function parens: avoid (omitted when single param)
  - Bracket spacing: true

**Linting:**
- ESLint with flat config (`eslint.config.js`)
- Three separate rule sets for different code sections:
  - **Plugin/Node code** (`src/**/*.ts`, excludes `src/ui/` and `src/client/`): Node/TypeScript rules
  - **Client code** (`src/client/**/*.ts`): Browser globals, no React rules
  - **UI/React code** (`src/ui/**/*.{ts,tsx}`): React + React Hooks + TypeScript rules
  - **Test files** (`tests/**/*.ts`, `src/**/*.test.{ts,tsx}`): Relaxed rules for test code

**Linting Rules:**
- `@typescript-eslint/no-unused-vars`: error with `argsIgnorePattern: '^_'` (unused params prefixed with `_` are ignored)
- `@typescript-eslint/no-explicit-any`: warn (soft guideline, used in tests)
- `no-empty`: error with `allowEmptyCatch: true` (empty catch blocks allowed)
- React-specific: `react/react-in-jsx-scope: off` (not needed with modern React)
- Test code: `@typescript-eslint/no-explicit-any: off`, `@typescript-eslint/no-non-null-assertion: off`

## Import Organization

**Order:**
1. **Node/built-in modules**: `import { EventEmitter } from 'events'`, `import path from 'path'`
2. **Third-party packages**: `import type { Plugin } from 'vite'`, `import React from 'react'`, `import { Button } from '@/ui/components/ui/button'`
3. **Relative imports from core**: `import { AssetManager } from '@vite-asset-manager/core'`
4. **Local absolute imports using aliases**: `import { useAssets } from '@/ui/hooks/useAssets'`, `import { cn } from '@/ui/lib/utils'`
5. **Type imports separated**: `import type { Asset, AssetType } from '../types'`

**Path Aliases:**
- `@/*` → `./src/*` (main plugin and shared code)
- `@/ui/*` → `./src/ui/*` (UI-specific paths when in UI context, see `src/ui/tsconfig.json`)
- No relative paths in barrel files; prefer explicit re-exports

**Barrel Files:**
- Used for grouping exports: `packages/core/src/types/index.ts`, `src/ui/components/ui/index.ts`
- Explicit re-exports: `export { Button } from './button'` (not wildcard exports)

## Error Handling

**Patterns:**
- Custom error class `AssetManagerError` extending `Error` with properties:
  - `message`: Error description
  - `statusCode`: HTTP status code
  - `code`: Error code string for categorization
  - `context?: Record<string, unknown>`: Additional context data
- Example: `throw new AssetManagerError('File not found', 404, 'FILE_NOT_FOUND', { path: filePath })`

**Try-catch blocks:**
- Used for async operations and API calls
- Error caught and re-thrown or logged with context
- In UI hooks: errors caught, set to state, and falsy values returned
- Example from `useSearch.ts`: `catch { setResults([]) }` (silent fail for user-friendly UX)

**Event-based error handling:**
- Services use `EventEmitter` for change events
- Consumers subscribe to events and handle accordingly
- No thrown errors in event handlers; logged instead

## Logging

**Framework:** `console` (standard browser/Node.js console)

**Patterns:**
- `console.error()` for errors: `console.error('Failed to copy path:', err)`
- `console.log()` only in debug modes or critical paths (rarely used)
- No logging framework dependency; debug output controlled via `debug` option in `AssetManagerOptions`
- Services check `options.debug` flag before logging diagnostic info

## Comments

**When to Comment:**
- JSDoc for public functions and exported types only (not every function)
- Explain "why," not "what" (code should be self-documenting)
- Complex regex patterns get detailed comments: `/** Regex patterns to find asset imports in source files. Each pattern captures the asset path in group 1. */`
- Constants with non-obvious values: `/** Source file extensions to scan for imports */` above `SOURCE_EXTENSIONS`

**JSDoc/TSDoc:**
- Used for public APIs in core package (`packages/core/src/`)
- Example from `editor-launcher.ts`:
  ```typescript
  /**
   * Opens a file in the configured editor at the specified line and column.
   *
   * @param absolutePath - Absolute path to the file
   * @param line - Line number (1-indexed)
   * @param column - Column number (1-indexed)
   * @param editor - Editor to open the file in
   */
  export function launchEditor(...)
  ```
- Not used in UI components (TypeScript interface inference sufficient)
- Not used in test files

## Function Design

**Size:**
- Keep functions small and single-responsibility
- ~50 lines typical, breaking at logical boundaries
- Hooks (React) tend to be 20-40 lines with clear setup/cleanup

**Parameters:**
- Prefer destructured object parameters for functions with 2+ params: `{ asset, index = 0, onPreview, isSelected = false, ...props }`
- Defaults for optional params: `index = 0`, `isSelected = false`
- Never use `any` except in test code (linter allows in tests)

**Return Values:**
- Explicit return types on all functions (except React components with inferred return)
- Functions return errors or throw (no silent failures in core package)
- UI hooks return objects with multiple values: `{ results, searching, searched, search, clear }`
- React components return JSX.Element (inferred)

## Module Design

**Exports:**
- Named exports for functions: `export function useAssets() {...}`
- Named exports for classes: `export class AssetScanner {...}`
- Default exports for React components (sometimes): `export const SearchBar = forwardRef(...)`
- Use `export type` for types: `export type AssetManagerConfig = {...}`
- Re-export from barrel files explicitly: `export { Button } from './button'` (not `export * from ...`)

**Barrel Files:**
- Located at `index.ts` or `index.tsx`
- Group related exports: `packages/core/src/types/index.ts` exports all types
- Used in: `packages/core/src/`, `src/ui/components/ui/`, `src/ui/hooks/`

**Service Classes:**
- Constructor initializes dependencies and validates
- Public methods only; no underscore-prefixed "private" methods (use `private` modifier)
- Use `EventEmitter` for change notifications: `class AssetScanner extends EventEmitter { ... }`
- Example: `AssetScanner`, `ImporterScanner`, `DuplicateScanner`, `ThumbnailService` all follow pattern
- Setup methods: `init()` for initialization, `destroy()` for cleanup, `setup*()` for watchers

**Utility Functions:**
- Shared utilities in `lib/` directories: `src/ui/lib/utils.ts`, `src/ui/lib/api-base.ts`
- Pure functions with no side effects
- Example: `cn()` (Tailwind class merging), `formatBytes()` (size formatting)

## React Conventions

**Component Naming:**
- `PascalCase` for component files: `AssetCard.tsx`, `SearchBar.tsx`
- Use `forwardRef` for components that need ref access: `export const SearchBar = forwardRef(...)`
- Set `displayName` on forwardRef components: `SearchBar.displayName = 'SearchBar'`

**Component Structure:**
- Props interface defined above component: `interface AssetCardProps { ... }`
- Use `memo()` for optimization: `export const AssetCard = memo(function AssetCard({...}) {...})`
- Use destructuring in component function parameters

**Hooks:**
- Always call at top level (never conditional)
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Use `useRef` for mutable values that don't cause re-renders
- Use `useState` for state that should trigger re-renders
- Use `useEffect` only when necessary; prefer hooks that handle side effects internally

**Event Handlers:**
- Prefix with `handle`: `handleClick`, `handleChange`, `handleCopyPath`, `handleImageError`
- Use `useCallback` to memoize: `const handleClick = useCallback(() => {...}, [dependencies])`
- Arrow function pattern: `onClick={() => handler()}` or pre-memoized `onClick={handleClick}`

**Mocking in UI Tests:**
- Use `vi.mock()` for module-level mocking
- Mock icon libraries to avoid DOM bloat: `@phosphor-icons/react` mocked as simple spans
- Mock child components: `vi.mock('./file-icon', ...)`, `vi.mock('./card-previews', ...)`
- Provide realistic mock data matching actual types

---

*Convention analysis: 2026-03-20*
