# Nuxt

The `@vite-asset-manager/nuxt` module provides first-class Nuxt 3/4 support with zero configuration.

## Features

- Automatic floating icon injection (no manual `app.vue` setup)
- Nuxt DevTools integration (iframe tab)
- Sensible Nuxt defaults for asset scanning
- Supports both Nuxt 3 and Nuxt 4 directory structures

## Installation

::: code-group

```bash [pnpm]
pnpm add -D @vite-asset-manager/nuxt
```

```bash [npm]
npm install -D @vite-asset-manager/nuxt
```

:::

## Setup

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@vite-asset-manager/nuxt']
})
```

That's it! Start your dev server and the floating icon will appear automatically.

## Configuration

All options are available under the `assetManager` key in your Nuxt config:

```ts
export default defineNuxtConfig({
  modules: ['@vite-asset-manager/nuxt'],
  assetManager: {
    base: '/__asset_manager__',
    include: ['assets', '../public'],
    floatingIcon: true,
    devtools: true,
  }
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `base` | `string` | `'/__asset_manager__'` | Base URL path for the dashboard |
| `include` | `string[]` | `['assets', '../public']` | Directories to scan (relative to `srcDir`) |
| `floatingIcon` | `boolean` | `true` | Inject floating icon overlay |
| `devtools` | `boolean` | `true` | Add tab to Nuxt DevTools |

### Path Aliases

For **Nuxt 3** (default structure):

```ts
assetManager: {
  aliases: { '@/': 'src/' }
}
```

For **Nuxt 4** (new `app/` directory structure):

```ts
assetManager: {
  aliases: { '@/': 'app/', '~/': '' }
}
```

## DevTools Integration

When `devtools: true` (the default), the asset manager adds an iframe tab to Nuxt DevTools. You can access it from the DevTools panel without opening the floating icon.

## How It Works

The Nuxt module uses:
- **Nitro `devHandlers`** for dev-only middleware (no production overhead)
- **Client-side plugin** (`plugin.client.ts`) for floating icon injection
- **Nuxt DevTools hooks** for iframe tab registration

The module re-exports `@vite-asset-manager/core` for all scanning, thumbnail generation, and API functionality.
