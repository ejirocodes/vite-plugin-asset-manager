<p align="center">
  <img src="./.github/assets/demo.gif" alt="Vite Plugin Asset Manager Demo" />
</p>

<h1 align="center">vite-plugin-asset-manager</h1>

<p align="center">
  Stop grepping for image paths.<br/>
  See exactly where every asset is used, find duplicates, and clean up what's unused.
</p>

<p align="center">
  <a href="https://vite-assets.vercel.app">Documentation</a> &middot;
  <a href="https://github.com/ejirocodes/vite-plugin-asset-manager/issues">Issues</a> &middot;
  <a href="https://www.npmjs.com/package/vite-plugin-asset-manager">npm</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vite-plugin-asset-manager"><img src="https://img.shields.io/npm/v/vite-plugin-asset-manager.svg?style=flat&colorA=18181B&colorB=28CF8D" alt="Version"></a>
  <a href="https://www.npmjs.com/package/vite-plugin-asset-manager"><img src="https://img.shields.io/npm/dm/vite-plugin-asset-manager.svg?style=flat&colorA=18181B&colorB=28CF8D" alt="Downloads"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat&colorA=18181B" alt="License">
</p>

---

## Quick Start

```bash
pnpm add -D vite-plugin-asset-manager
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [assetManager()],
})
```

Start your dev server, then press <kbd>⌥</kbd><kbd>⇧</kbd><kbd>A</kbd> or visit `/__asset_manager__/`.

## Framework Support

Works automatically with **Vue, React, Svelte, Solid, Lit, Preact, Qwik**, and **Vanilla** Vite projects.

Official packages for SSR frameworks:

| Framework | Package | Docs |
|-----------|---------|------|
| **Nuxt 3/4** | `@vite-asset-manager/nuxt` | [Guide](https://vite-assets.vercel.app/ssr/nuxt) |
| **Next.js 14+** | `nextjs-asset-manager` | [Guide](https://vite-assets.vercel.app/ssr/nextjs) |
| **TanStack Start** | Manual setup | [Guide](https://vite-assets.vercel.app/ssr/tanstack-start) |

## Configuration

```ts
assetManager({
  base: '/__asset_manager__',
  include: ['src', 'public'],
  exclude: ['node_modules', '.git', 'dist'],
  thumbnailSize: 200,
  floatingIcon: true,
  watch: true,
  launchEditor: 'code',
  aliases: { '@/': 'src/' },
})
```

All options are optional. See the [full configuration reference](https://vite-assets.vercel.app/guide/configuration).

## License

[MIT](LICENSE)
