import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import AssetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), AssetManager()],
  server: {
    open: true
  }
})
