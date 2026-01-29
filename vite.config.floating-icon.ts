import { defineConfig } from 'vite'
import path from 'path'

/**
 * Build configuration for the floating icon component.
 *
 * This builds the floating icon as a standalone IIFE that can be
 * injected into any Vite app regardless of framework.
 *
 * The BASE_URL placeholder is replaced at runtime by the plugin.
 */
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/client/floating-icon/index.ts'),
      formats: ['iife'],
      name: 'ViteAssetManagerFloatingIcon',
      fileName: () => 'floating-icon.js'
    },
    outDir: 'dist/client',
    emptyOutDir: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Ensure the IIFE is self-executing
        inlineDynamicImports: true
      }
    }
  },
})
