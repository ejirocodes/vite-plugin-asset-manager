# React

Vite Asset Manager works out of the box with React + Vite projects.

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
import react from '@vitejs/plugin-react'
import assetManager from 'vite-plugin-asset-manager'

export default defineConfig({
  plugins: [
    react(),
    assetManager()
  ]
})
```

Start your dev server and the floating icon will appear.

## Path Aliases

The default alias `{ '@/': 'src/' }` works with the standard CRA-style or Vite template structure. If your `tsconfig.json` uses different paths:

```ts
assetManager({
  aliases: { '@/': 'src/', '@components/': 'src/components/' }
})
```

## Using with Next.js

For Next.js projects, use the dedicated [`nextjs-asset-manager`](/ssr/nextjs) package instead. It provides an API route handler and client component for floating icon injection.
