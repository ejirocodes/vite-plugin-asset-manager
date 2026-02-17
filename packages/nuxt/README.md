# @vite-asset-manager/nuxt

Official [Nuxt](https://nuxt.com) module for [vite-plugin-asset-manager](https://github.com/ejirocodes/vite-plugin-asset-manager) — a visual asset management dashboard that discovers, catalogs, and displays all your project's media assets.

## Features

- **Zero-config** — works out of the box with sensible Nuxt defaults
- **Automatic floating icon** — injected into your app, no manual setup needed
- **Nuxt DevTools integration** — browse assets directly from the DevTools panel
- **Nuxt 3 & 4 support** — handles both directory structures automatically
- **Dev-only** — zero production footprint, completely inactive outside development
- **Real-time updates** — file changes reflected instantly via SSE
- **Thumbnail generation** — Sharp-powered thumbnails with caching
- **Import tracking** — see which files import each asset with click-to-open-in-editor
- **Duplicate detection** — find duplicate files by content hash

## Installation

```bash
npm install @vite-asset-manager/nuxt -D
# or
pnpm add @vite-asset-manager/nuxt -D
# or
yarn add @vite-asset-manager/nuxt -D
```

## Setup

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@vite-asset-manager/nuxt'],
})
```

That's it! Start your dev server and:

- Press **`Option+Shift+A`** to toggle the floating panel
- Click the floating icon button (drag to reposition)
- Visit `/__asset_manager__/` directly in your browser
- Open the **Asset Manager** tab in Nuxt DevTools

## Configuration

All options are optional:

```ts
export default defineNuxtConfig({
  modules: ['@vite-asset-manager/nuxt'],
  assetManager: {
    // Dashboard URL path
    base: '/__asset_manager__',

    // Directories to scan (relative to project root)
    // Default: ['app', 'public'] for Nuxt 4, ['.'] for Nuxt 3
    include: ['app', 'public'],

    // Directories to exclude
    exclude: ['node_modules', '.git', '.nuxt', '.output', 'dist'],

    // Show floating icon overlay
    floatingIcon: true,

    // Enable real-time file watching
    watch: true,

    // Editor for click-to-open: 'code', 'cursor', 'webstorm', 'vim', etc.
    launchEditor: 'code',

    // Path aliases for import detection
    aliases: { '@/': 'app/', '~/': 'app/' },

    // Add Asset Manager tab to Nuxt DevTools
    devtools: true,

    // Enable debug logging
    debug: false,
  },
})
```

### Nuxt 3 vs Nuxt 4

The module automatically detects your Nuxt version and adjusts defaults:

| Setting | Nuxt 3 | Nuxt 4 |
|---------|--------|--------|
| `include` | `['.']` | `['app', 'public']` |
| `aliases` | `{ '@/': '', '~/': '' }` | `{ '@/': 'app/', '~/': 'app/' }` |

## Requirements

- Nuxt >= 3.0.0
- Node.js >= 22

## Related

- [`vite-plugin-asset-manager`](https://www.npmjs.com/package/vite-plugin-asset-manager) — Main Vite plugin (for non-Nuxt Vite projects)
- [`nextjs-asset-manager`](https://www.npmjs.com/package/nextjs-asset-manager) — Official Next.js integration
- [`@vite-asset-manager/core`](https://www.npmjs.com/package/@vite-asset-manager/core) — Core package

## License

[MIT](https://github.com/ejirocodes/vite-plugin-asset-manager/blob/main/LICENSE)
