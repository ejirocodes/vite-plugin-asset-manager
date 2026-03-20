# Vanilla

Vite Asset Manager works with plain Vite projects that don't use any framework.

## Setup

Install the plugin:

::: code-group

```bash [pnpm]
pnpm add -D vite-plugin-asset-manager
```

```bash [npm]
npm install -D vite-plugin-asset-manager
```

:::

Add it to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Multi-Page Apps

For Vite multi-page apps, the floating icon is injected into each HTML page via the `transformIndexHtml` hook. The asset manager scans all configured directories regardless of which page you're on.

```ts
assetManager({
  include: ['src', 'public', 'pages'] // Add all asset directories
})
```
