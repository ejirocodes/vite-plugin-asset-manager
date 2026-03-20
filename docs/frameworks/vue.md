---
description: Set up Vite Asset Manager in a Vue + Vite project. Zero-config integration with path alias support.
---

# Vue

Vite Asset Manager works out of the box with Vue + Vite projects.

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
import vue from '@vitejs/plugin-vue'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    vue(),
    assetManager()
  ]
})
```

Start your dev server and the asset manager is ready. A floating icon will appear in the bottom-right corner of your app.

## Path Aliases

If you use the default `@/` alias that maps to `src/`, no extra configuration is needed - the plugin uses `{ '@/': 'src/' }` by default.

For custom aliases, update the `aliases` option:

```ts
assetManager({
  aliases: { '@/': 'src/', '@assets/': 'src/assets/' }
})
```

## Using with Nuxt

For Nuxt projects, use the dedicated [`@vite-asset-manager/nuxt`](/ssr/nuxt) module instead. It provides automatic floating icon injection, DevTools integration, and sensible Nuxt defaults.
