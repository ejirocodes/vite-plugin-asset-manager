import { defineConfig } from 'vite'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [assetManager()],
  server: {
    open: true
  }
})
