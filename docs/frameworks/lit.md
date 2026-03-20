# Lit

Vite Asset Manager works out of the box with Lit + Vite projects.

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

## Path Aliases

Lit projects typically use standard Vite path resolution. If you have custom aliases:

```ts
assetManager({
  aliases: { '@/': 'src/' }
})
```
