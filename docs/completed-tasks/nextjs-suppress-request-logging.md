# Plan: Suppress Next.js Dev Server Request Logging via `withAssetManager()` Wrapper

## Goal

Export a `withAssetManager()` config wrapper from `nextjs-asset-manager` that automatically suppresses dev server request logging for asset manager API routes, following the established `withX` community convention.

## Approach

Add a `withAssetManager(nextConfig, options?)` higher-order function that deep-merges `logging.incomingRequests.ignore` into the user's Next.js config. This is a pure object transform — no side effects, no Next.js runtime imports. The function respects existing user config (`logging: false`, existing ignore patterns, etc.) and accepts an optional `base` parameter to match custom API paths.

## Changes

### 1. New File: Config Wrapper

**File:** `packages/nextjs/src/with-asset-manager.ts` (new)

The core of the feature — a function that wraps `NextConfig` and injects the logging ignore pattern.

```typescript
import type { NextConfig } from 'next'

export interface WithAssetManagerOptions {
  base?: string
}

export function withAssetManager(
  nextConfig: NextConfig = {},
  options: WithAssetManagerOptions = {}
): NextConfig {
  const base = options.base ?? '/api/asset-manager'

  // Respect user's choice to disable logging entirely
  if (nextConfig.logging === false) {
    return nextConfig
  }

  const existingLogging =
    typeof nextConfig.logging === 'object' ? nextConfig.logging : {}

  // Respect user's choice to disable incoming request logging entirely
  if (existingLogging.incomingRequests === false) {
    return nextConfig
  }

  const existingIncoming =
    typeof existingLogging.incomingRequests === 'object'
      ? existingLogging.incomingRequests
      : {}

  const existingIgnore = Array.isArray(existingIncoming.ignore)
    ? existingIncoming.ignore
    : []

  // Build regex that matches the base path
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(escapedBase)

  return {
    ...nextConfig,
    logging: {
      ...existingLogging,
      incomingRequests: {
        ...existingIncoming,
        ignore: [...existingIgnore, pattern],
      },
    },
  }
}
```

Edge cases handled:
- `logging: false` → returned as-is (user disabled all logging)
- `logging.incomingRequests: false` → returned as-is (user disabled request logging)
- `logging.incomingRequests.ignore: [existing]` → our pattern appended, existing preserved
- Custom `base` → regex escaped and used as pattern
- No config at all → works with empty object default

### 2. Update Exports

**File:** `packages/nextjs/src/index.ts`

Add the new export alongside existing ones.

Before:
```typescript
// Handler
export { createHandler, type NextAssetManagerOptions } from './handler.js'

// Client component
export {
  AssetManagerScript,
  type AssetManagerScriptProps,
} from './components/AssetManagerScript.js'
```

After:
```typescript
// Handler
export { createHandler, type NextAssetManagerOptions } from './handler.js'

// Config wrapper
export {
  withAssetManager,
  type WithAssetManagerOptions,
} from './with-asset-manager.js'

// Client component
export {
  AssetManagerScript,
  type AssetManagerScriptProps,
} from './components/AssetManagerScript.js'
```

### 3. Update Playground

**File:** `playgrounds/nextjs/next.config.ts`

Demonstrate usage in the playground. Currently has `logging: false` which disables all logging — replace with the wrapper approach.

Before:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: false
};

export default nextConfig;
```

After:
```typescript
import type { NextConfig } from "next";
import { withAssetManager } from "nextjs-asset-manager";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withAssetManager(nextConfig);
```

### 4. Add `next` Type to tsup Externals

**File:** `packages/nextjs/tsup.config.ts`

The `next` package is already in the externals list, so the `import type { NextConfig } from 'next'` in `with-asset-manager.ts` is already handled — type-only imports are erased at compile time anyway. No change needed here.

## Considerations

- **Type-only import**: `NextConfig` from `next` is used only as a type, so it's erased at compile time. No runtime dependency on `next` from this file. The `withAssetManager` function is a pure object transform.
- **Regex escaping**: The base path is regex-escaped before being used in the ignore pattern. This handles paths like `/api/asset-manager` (with literal hyphens) correctly.
- **Composability**: Works with other `withX` wrappers via standard nesting: `withAssetManager(withSentry(baseConfig))`.
- **No breaking changes**: This is a purely additive change — new export, no modifications to existing APIs.
- **`logging: false` edge case**: The playground currently has `logging: false`. Our wrapper correctly detects this and returns the config as-is. The playground update will remove `logging: false` and use the wrapper instead, which is the intended consumer experience.

## Tasks

### Phase 1: Implementation

- [x] Create `packages/nextjs/src/with-asset-manager.ts` with `withAssetManager()` function
- [x] Update `packages/nextjs/src/index.ts` to export `withAssetManager` and `WithAssetManagerOptions`
- [x] Update `playgrounds/nextjs/next.config.ts` to use `withAssetManager()` wrapper

### Phase 2: Verify

- [x] Build the nextjs package (`pnpm run build:packages`)
- [x] Verify the playground works (`pnpm run playground:nextjs`) — asset manager loads, no request spam in console

---

*Ready for your review. Add any inline notes and I'll update the plan accordingly.*
