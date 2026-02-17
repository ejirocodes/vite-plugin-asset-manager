# nextjs-asset-manager

Official [Next.js](https://nextjs.org) integration for [vite-plugin-asset-manager](https://github.com/ejirocodes/vite-plugin-asset-manager) — a visual asset management dashboard that discovers, catalogs, and displays all your project's media assets.

## Features

- **Dev-only** — returns 404 in production, zero production footprint
- **Automatic floating icon** — injected via client component
- **App Router native** — uses Next.js catch-all route handlers
- **HMR stable** — `globalThis` singleton pattern survives hot module replacement
- **Composable config** — `withAssetManager()` works alongside `withSentryConfig`, `withBundleAnalyzer`, etc.
- **Real-time updates** — file changes reflected instantly via SSE
- **Thumbnail generation** — Sharp-powered thumbnails with caching
- **Import tracking** — see which files import each asset with click-to-open-in-editor
- **Duplicate detection** — find duplicate files by content hash

## Installation

```bash
npm install nextjs-asset-manager -D
# or
pnpm add nextjs-asset-manager -D
# or
yarn add nextjs-asset-manager -D
```

## Setup

### 1. Wrap your Next.js config

This suppresses asset manager request logging in the dev server:

```ts
// next.config.ts
import type { NextConfig } from 'next'
import { withAssetManager } from 'nextjs-asset-manager'

const nextConfig: NextConfig = {}
export default withAssetManager(nextConfig)
```

### 2. Create the API route handler

```ts
// app/api/asset-manager/[[...path]]/route.ts
import { createHandler } from 'nextjs-asset-manager'

const { GET, POST } = createHandler()
export { GET, POST }
```

### 3. Add the client component

```tsx
// app/layout.tsx
import { AssetManagerScript } from 'nextjs-asset-manager'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AssetManagerScript />
      </body>
    </html>
  )
}
```

Start your dev server and:

- Press **`Option+Shift+A`** to toggle the floating panel
- Click the floating icon button (drag to reposition)
- Visit `/api/asset-manager/` directly in your browser

## Configuration

Pass options to `createHandler()`:

```ts
import { createHandler } from 'nextjs-asset-manager'

const { GET, POST } = createHandler({
  // Dashboard URL path (must match your route file location)
  base: '/api/asset-manager',

  // Directories to scan
  include: ['app', 'public', 'src'],

  // Directories to exclude
  exclude: ['node_modules', '.git', '.next', 'dist'],

  // Editor for click-to-open: 'code', 'cursor', 'webstorm', 'vim', etc.
  launchEditor: 'code',

  // Path aliases for import detection
  aliases: { '@/': 'src/' },

  // Enable debug logging
  debug: false,
})

export { GET, POST }
```

Configure the floating icon position:

```tsx
<AssetManagerScript base="/api/asset-manager" />
```

## How It Works

- **`createHandler()`** — Returns `{ GET, POST }` route handlers that initialize the asset manager, serve the dashboard UI, and handle all API requests through a catch-all route
- **`withAssetManager()`** — Wraps your Next.js config to suppress noisy dev server request logs from the asset manager
- **`AssetManagerScript`** — A `'use client'` component that injects the floating icon script in development

The asset manager uses a `globalThis` singleton (similar to Prisma's pattern) to survive Next.js HMR re-evaluation without losing state.

## Requirements

- Next.js >= 14.0.0
- React >= 18.0.0
- Node.js >= 22

## Related

- [`vite-plugin-asset-manager`](https://www.npmjs.com/package/vite-plugin-asset-manager) — Main Vite plugin
- [`@vite-asset-manager/nuxt`](https://www.npmjs.com/package/@vite-asset-manager/nuxt) — Official Nuxt module
- [`@vite-asset-manager/core`](https://www.npmjs.com/package/@vite-asset-manager/core) — Core package

## License

[MIT](https://github.com/ejirocodes/vite-plugin-asset-manager/blob/main/LICENSE)
