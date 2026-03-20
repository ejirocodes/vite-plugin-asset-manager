# Preact

Vite Asset Manager works out of the box with Preact + Vite projects.

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
import preact from '@preact/preset-vite'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    preact(),
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Path Aliases

The default alias `{ '@/': 'src/' }` works with the standard Preact + Vite template structure.

```ts
assetManager({
  aliases: { '@/': 'src/' }
})
```
