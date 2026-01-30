import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/ui',
  base: '/__asset_manager__/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
      output: {
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          // UI component libraries
          if (
            id.includes('node_modules/@base-ui') ||
            id.includes('node_modules/class-variance-authority') ||
            id.includes('node_modules/clsx') ||
            id.includes('node_modules/tailwind-merge') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/next-themes')
          ) {
            return 'vendor-ui'
          }
          // Icons (large bundle)
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'vendor-icons'
          }
          // Virtual scrolling
          if (id.includes('node_modules/@tanstack/react-virtual')) {
            return 'vendor-virtual'
          }
        }
      }
    }
  }
})
