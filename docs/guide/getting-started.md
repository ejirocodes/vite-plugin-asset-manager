---
description: Install and configure Vite Asset Manager in under 2 minutes. Works with any Vite-powered project.
---

# Getting Started

Get up and running with Vite Asset Manager in under 2 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) version 22 or higher
- [Vite](https://vite.dev/) version 5.0.0 or higher
- A Vite-powered project

## Installation

::: code-group

```bash [pnpm]
pnpm add -D vite-plugin-asset-manager
```

```bash [npm]
npm install -D vite-plugin-asset-manager
```

```bash [yarn]
yarn add -D vite-plugin-asset-manager
```

```bash [bun]
bun add -D vite-plugin-asset-manager
```

:::

## Basic Setup

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    assetManager()
  ]
})
```

That's it! Start your dev server and the asset manager is ready:

```bash
pnpm dev
```

## Accessing the Dashboard

Once your dev server is running, you can access the asset manager in two ways:

### Floating Icon

A small floating icon appears in the bottom-right corner of your app. Click it to open the asset manager panel, or press <kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> to toggle it.

### Direct URL

Navigate directly to the dashboard at:

```
http://localhost:5173/__asset_manager__/
```

::: tip
The base path is configurable via the `base` option. The default is `/__asset_manager__/`.
:::

## What You'll See

The dashboard displays all media assets in your project organized by type:

- **Images** - jpg, png, svg, webp, avif, gif, ico
- **Videos** - mp4, webm, mov, avi
- **Audio** - mp3, wav, ogg, flac
- **Fonts** - woff, woff2, ttf, otf, eot
- **Documents** - pdf, doc, docx, xls, xlsx
- **Data** - json, xml, csv, yaml, toml
- **Text** - txt, md, html, css

Each asset card shows a thumbnail preview (for supported image formats), file size, type badge, and import count.

## Next Steps

- [Configuration](/guide/configuration) - Customize paths, thumbnail size, and more
- [Framework Guides](/frameworks/vue) - Framework-specific setup instructions
- [Features](/features/overview) - Explore all dashboard capabilities
