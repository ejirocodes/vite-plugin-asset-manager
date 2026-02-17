import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  external: ['vite', 'sharp', 'archiver', 'picocolors'],
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  target: 'node18',
  shims: true,
  esbuildOptions(options) {
    options.alias = {
      '@': './src'
    }
  }
})
