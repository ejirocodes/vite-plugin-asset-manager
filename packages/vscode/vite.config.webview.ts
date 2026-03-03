import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '../../src/ui'),
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, '../../src/ui/index.html'),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
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
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/@tanstack/react-virtual')) {
            return 'vendor-virtual'
          }
        }
      }
    }
  }
})
