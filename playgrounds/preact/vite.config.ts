import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import assetManager from '../../src/index'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), assetManager()],
  server: {
    open: true
  }
})
