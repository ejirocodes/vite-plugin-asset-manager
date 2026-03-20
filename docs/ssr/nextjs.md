# Next.js

The `nextjs-asset-manager` package provides first-class Next.js 14+ support with App Router integration.

## Features

- API route handler for asset management
- Client component for floating icon injection
- Config wrapper to suppress dev server request logging
- Dev-only — returns 404 in production

## Installation

::: code-group

```bash [pnpm]
pnpm add -D nextjs-asset-manager
```

```bash [npm]
npm install -D nextjs-asset-manager
```

:::

## Setup

Three steps to get running:

### 1. Configure Next.js

Wrap your config with `withAssetManager` to suppress noisy dev server logs:

```ts
// next.config.ts
import { withAssetManager } from 'nextjs-asset-manager'

const nextConfig = {
  // your existing config
}

export default withAssetManager(nextConfig)
```

### 2. Create API Route

Create a catch-all API route for the asset manager:

```ts
// app/api/asset-manager/[[...path]]/route.ts
import { createHandler } from 'nextjs-asset-manager'

const { GET, POST } = createHandler()

export { GET, POST }
```

### 3. Add Floating Icon

Add the `AssetManagerScript` component to your root layout:

```tsx
// app/layout.tsx
import { AssetManagerScript } from 'nextjs-asset-manager'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

Start your dev server and the floating icon will appear.

## Configuration

Pass options to `createHandler`:

```ts
const { GET, POST } = createHandler({
  base: '/api/asset-manager',
  include: ['app', 'public', 'src'],
  thumbnails: true,
  launchEditor: 'code',
})
```

### Default Options

| Option | Default | Notes |
|--------|---------|-------|
| `base` | `'/api/asset-manager'` | Next.js treats `_`-prefixed folders as private |
| `include` | `['app', 'public', 'src']` | Next.js directory conventions |

## How It Works

- **`createHandler()`** returns `{ GET, POST }` route handlers that bridge Next.js Web API (`Request`/`Response`) to the core Node.js middleware
- **`AssetManagerScript`** is a `'use client'` component that injects the floating icon scripts
- **`withAssetManager()`** wraps your Next.js config to suppress dev server request logging for asset manager routes
- Uses `globalThis` singleton pattern (like Prisma) to survive Next.js HMR module re-evaluation

::: warning
The asset manager only runs in development. In production (`NODE_ENV === 'production'`), the API route returns 404.
:::
