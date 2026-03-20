# Qwik

Vite Asset Manager works out of the box with Qwik + Vite projects.

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
import { qwikVite } from '@builder.io/qwik/optimizer'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    qwikVite(),
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Path Aliases

If your Qwik project uses custom path aliases:

```ts
assetManager({
  aliases: { '@/': 'src/' }
})
```
