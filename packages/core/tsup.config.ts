import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: [
    'sharp',
    'launch-editor',
    'fast-glob',
    'chokidar',
    'archiver',
    'sirv'
  ],
  treeshake: true
})
