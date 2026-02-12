import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: [
    '@vite-asset-manager/core',
    'react',
    'react/jsx-runtime',
    'next',
    'next/script',
  ],
  treeshake: true,
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
