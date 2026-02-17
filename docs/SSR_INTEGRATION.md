# SSR Framework Integration Guide

This guide covers **manual script injection** for SSR frameworks that don't have an official integration package.

## Official Integration Packages

If you're using **Nuxt** or **Next.js**, use the official packages instead of manual setup:

- **Nuxt 3/4**: [`@vite-asset-manager/nuxt`](https://www.npmjs.com/package/@vite-asset-manager/nuxt) — zero-config module with automatic floating icon injection and DevTools integration
- **Next.js 14+**: [`nextjs-asset-manager`](https://www.npmjs.com/package/nextjs-asset-manager) — App Router route handlers with automatic floating icon via client component

---

## Why Manual Setup is Needed

SSR frameworks dynamically generate HTML and don't use static `index.html` files. This means:

- The `transformIndexHtml()` Vite hook is not called (no static HTML file exists)
- Scripts must be injected directly in the SSR component tree

**The Solution**: Add the floating icon scripts directly in your framework's root component.

---

## TanStack Start Setup

### Step 1: Add Scripts to Root Component

Edit your `src/routes/__root.tsx` file and add the floating icon scripts before the closing `</body>` tag:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

export const Route = createRootRoute({
  shellComponent: RootDocument
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right'
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />
            }
          ]}
        />
        <Scripts />

        {/* Vite Plugin Asset Manager - Floating Icon Injection */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__VAM_BASE_URL__ = "/__asset_manager__";`
          }}
        />
        <script type="module" src="/__asset_manager__/floating-icon.js" />
      </body>
    </html>
  )
}
```

### Step 2: Configure the Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import AssetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    tanstackStart(),
    AssetManager() // Works with manual script injection!
  ]
})
```

### Step 3: Test

Start your dev server and verify:

```bash
pnpm run dev
```

- Visit `http://localhost:3000`
- Floating icon should appear in the bottom-right corner
- Press `Option+Shift+A` (⌥⇧A) to toggle the Asset Manager panel
- Access dashboard directly at `http://localhost:3000/__asset_manager__/`

---

## Remix Setup

### Step 1: Configure the Plugin

Add the plugin to your `vite.config.ts`:

```typescript
// vite.config.ts
import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import AssetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    remix(),
    AssetManager()
  ]
})
```

### Step 2: Add Scripts to Root Component

Edit your `app/root.tsx` file:

```tsx
import { Scripts, ScrollRestoration } from '@remix-run/react'

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />

        {/* Vite Plugin Asset Manager - Floating Icon Injection */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.__VAM_BASE_URL__ = "/__asset_manager__";`
              }}
            />
            <script type="module" src="/__asset_manager__/floating-icon.js" />
          </>
        )}
      </body>
    </html>
  )
}
```

---

## Solid Start Setup

### Step 1: Configure the Plugin

Add the plugin to your `app.config.ts`:

```typescript
// app.config.ts
import { defineConfig } from '@solidjs/start/config'
import AssetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  vite: {
    plugins: [
      AssetManager()
    ]
  }
})
```

### Step 2: Add Scripts to Root Component

Edit your `src/root.tsx` file:

```tsx
import { Suspense } from 'solid-js'
import { FileRoutes, Scripts } from 'solid-start/root'

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Suspense>
          <FileRoutes />
        </Suspense>
        <Scripts />

        {/* Vite Plugin Asset Manager - Floating Icon Injection */}
        {import.meta.env.DEV && (
          <>
            <script innerHTML={`window.__VAM_BASE_URL__ = "/__asset_manager__";`} />
            <script type="module" src="/__asset_manager__/floating-icon.js" />
          </>
        )}
      </body>
    </html>
  )
}
```

---

## SvelteKit Setup

### Step 1: Configure the Plugin

Add the plugin to your `vite.config.ts`:

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import AssetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    sveltekit(),
    AssetManager()
  ]
})
```

### Step 2: Add Scripts to Layout

Edit your `src/routes/+layout.svelte` file:

```svelte
<script>
  import { dev } from '$app/environment'
</script>

<slot />

{#if dev}
  <!-- Vite Plugin Asset Manager - Floating Icon Injection -->
  {@html '<script>window.__VAM_BASE_URL__ = "/__asset_manager__";</script>'}
  <script type="module" src="/__asset_manager__/floating-icon.js"></script>
{/if}
```

---

## Plugin Configuration

All SSR frameworks use the same plugin options. The configuration file varies by framework:

| Framework | Config File | Plugin Location |
|-----------|-------------|-----------------|
| TanStack Start | `vite.config.ts` | `plugins: [...]` |
| Remix | `vite.config.ts` | `plugins: [...]` |
| Solid Start | `app.config.ts` | `vite.plugins: [...]` |
| SvelteKit | `vite.config.ts` | `plugins: [...]` |

### Available Options

```typescript
AssetManager({
  // Base path for asset manager (default: '/__asset_manager__')
  base: '/__asset_manager__',

  // Enable/disable floating icon (default: true)
  floatingIcon: true,

  // Directories to scan for assets (default: ['src', 'public'])
  include: ['src', 'public'],

  // Directories to exclude (default shown)
  exclude: ['node_modules', '.git', 'dist', '.cache', 'coverage'],

  // Enable file watching for real-time updates (default: true)
  watch: true,

  // Editor for "Open in Editor" feature (default: 'code')
  launchEditor: 'code' // 'code' | 'cursor' | 'webstorm' | 'vim' | etc.
})
```

---

## Disabling the Floating Icon

If you prefer to disable the floating icon and only access via URL:

```typescript
AssetManager({
  floatingIcon: false // Disable floating icon
})
```

Then access the dashboard directly at: `http://localhost:5173/__asset_manager__/`

---

## Troubleshooting

### Floating Icon Not Appearing

1. **Check that scripts are injected**
   - View page source (Cmd+U / Ctrl+U)
   - Search for `__VAM_BASE_URL__` and `floating-icon.js`
   - Should appear before `</body>`

2. **Verify script order**
   - Asset Manager scripts should come **after** framework scripts
   - In TanStack Start: after `<Scripts />`
   - In Remix: after `<Scripts />`

3. **Check browser console for errors**
   - Open DevTools Console (F12)
   - Look for 404 errors on `floating-icon.js`
   - Look for JavaScript errors related to `__VAM_BASE_URL__`

4. **Verify the API works**
   - Visit `http://localhost:5173/__asset_manager__/` directly
   - If this works, the issue is only with floating icon injection

5. **Check plugin options**
   - Ensure `floatingIcon: true` (default)
   - Verify `base` path matches your injected scripts

### 404 Error on floating-icon.js

This usually means the plugin build is incomplete:

```bash
# Rebuild the plugin
pnpm run build

# Or build just the floating icon
pnpm run build:floating-icon
```

### Duplicate Floating Icons

If you see multiple floating icon instances:
- Remove any duplicate script injections
- Check for both manual AND automatic injection (should only use one)
- Verify plugin is only initialized once in config

### TypeScript Errors

If you get TypeScript errors about `dangerouslySetInnerHTML`:

```tsx
// Add this TypeScript ignore comment if needed
{/* @ts-ignore */}
<script
  dangerouslySetInnerHTML={{
    __html: `window.__VAM_BASE_URL__ = "/__asset_manager__";`
  }}
/>
```

### Keyboard Shortcut Not Working

The keyboard shortcut `Option+Shift+A` (⌥⇧A) requires:
1. Floating icon scripts properly injected
2. `window.__VAM_BASE_URL__` defined before `floating-icon.js` loads
3. Page must be focused (click anywhere on the page first)

---

## Performance Considerations

### Development Only

The Asset Manager only runs in development mode (`apply: 'serve'`). It will not affect production builds.

### Conditional Rendering

To ensure scripts are only injected in development:

**React/Remix:**
```tsx
{process.env.NODE_ENV === 'development' && (
  <script ... />
)}
```

**SvelteKit:**
```svelte
{#if dev}
  <script ...></script>
{/if}
```

**Solid Start:**
```tsx
{import.meta.env.DEV && (
  <script ... />
)}
```

---

## How It Works

### Architecture

1. **Plugin Layer** (`src/plugin.ts`)
   - Configures Vite dev server
   - Sets up asset scanning and API endpoints
   - Serves pre-built dashboard UI

2. **Server Layer** (`src/server/`)
   - Scans project directories for assets
   - Generates thumbnails on-demand
   - Provides REST API for asset operations
   - Tracks which files import each asset

3. **Floating Icon** (`src/client/floating-icon/`)
   - Framework-agnostic overlay button
   - Built as IIFE (self-executing JavaScript)
   - Manages panel state with localStorage
   - Handles keyboard shortcuts

4. **Dashboard UI** (`src/ui/`)
   - React-based asset browser
   - Real-time updates via Server-Sent Events (SSE)
   - Supports bulk operations, search, filtering

### Script Injection Flow

```
1. Your SSR framework renders HTML with injected scripts
   ↓
2. Browser loads page and executes:
   window.__VAM_BASE_URL__ = "/__asset_manager__"
   ↓
3. Browser loads floating-icon.js (IIFE module)
   ↓
4. Floating icon initializes:
   - Creates overlay button
   - Sets up keyboard listeners (⌥⇧A)
   - Loads panel state from localStorage
   ↓
5. User clicks icon or presses ⌥⇧A
   ↓
6. Panel opens with iframe to: {baseUrl}?embedded=true
   ↓
7. Dashboard loads and connects to API/SSE for real-time updates
```

---

## Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Visit the [GitHub Issues](https://github.com/ejirocodes/vite-plugin-asset-manager/issues)
3. Include your framework/version, browser console errors, and relevant config files

## License

MIT License - same as the main plugin.
