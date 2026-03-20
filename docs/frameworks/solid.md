---
description: Set up Vite Asset Manager in a Solid + Vite project.
---

# Solid

Vite Asset Manager works out of the box with Solid + Vite projects.

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
import solidPlugin from 'vite-plugin-solid'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    solidPlugin(),
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Path Aliases

The default alias `{ '@/': 'src/' }` works with the standard Solid + Vite template structure.

```ts
assetManager({
  aliases: { '@/': 'src/' }
})
```
