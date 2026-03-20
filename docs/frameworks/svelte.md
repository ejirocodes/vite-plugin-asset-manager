---
description: Set up Vite Asset Manager in a Svelte + Vite project with $lib alias support.
---

# Svelte

Vite Asset Manager works out of the box with Svelte + Vite projects.

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
import { svelte } from '@sveltejs/vite-plugin-svelte'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    svelte(),
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Path Aliases

If your Svelte project uses `$lib` aliases, configure them:

```ts
assetManager({
  aliases: { '$lib/': 'src/lib/' }
})
```

## SvelteKit

For SvelteKit projects, the plugin works in the Vite config but requires manual script injection for SSR. See the [SSR Integration](/ssr/tanstack-start) guide for details on manual setup with SSR frameworks.
