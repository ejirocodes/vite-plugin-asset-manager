# TanStack Start

TanStack Start uses SSR, which means the floating icon must be manually injected into your root component.

## Setup

### 1. Install the Plugin

::: code-group

```bash [pnpm]
pnpm add -D vite-plugin-asset-manager
```

```bash [npm]
npm install -D vite-plugin-asset-manager
```

:::

### 2. Configure Vite

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    tanstackStart(),
    assetManager()
  ]
})
```

### 3. Inject Floating Icon Scripts

Edit your `src/routes/__root.tsx` and add the scripts before `</body>`:

```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />

        {/* Vite Plugin Asset Manager */}
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

::: tip
The `__VAM_BASE_URL__` script must come **before** `floating-icon.js` so the icon knows where to find the API.
:::

Start your dev server and the floating icon will appear.

## Why Manual Injection?

SSR frameworks generate HTML dynamically and don't use static `index.html` files. This means Vite's `transformIndexHtml()` hook isn't called, so the floating icon scripts must be added manually to the component tree.

## Other SSR Frameworks

The same manual injection pattern works with any SSR framework:

| Framework | Root File | Dev Check |
|-----------|-----------|-----------|
| **Remix** | `app/root.tsx` | `process.env.NODE_ENV === 'development'` |
| **SvelteKit** | `src/routes/+layout.svelte` | `import { dev } from '$app/environment'` |
| **Solid Start** | `src/root.tsx` | `import.meta.env.DEV` |

For all SSR frameworks, add these two script tags before `</body>`:

```html
<script>window.__VAM_BASE_URL__ = "/__asset_manager__";</script>
<script type="module" src="/__asset_manager__/floating-icon.js"></script>
```

::: warning
Wrap the scripts in a dev-only conditional to avoid loading them in production builds.
:::
