import { defineConfig } from 'vite'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [assetManager({
    launchEditor: 'cursor'
  })],
  server: {
    open: true
  }
})
