import { defineConfig } from 'vite'
import AssetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [AssetManager()],
  server: {
    open: true
  }
})
